import {
  Snapshot,
  SnapshotData,
  SnapshotUpdates,
  isSnapshot,
} from './snapshot';
import {
  isUndefined,
  assertIsDefined,
  isDefined,
  assert,
} from '@snapdm/preconditions';
import { adapter } from './adapter';
import { merge } from './utils/merge';
import { DeepPartial } from 'ts-essentials';
import { delegate } from './utils/delegate';
import { DocumentReference } from './adapter/references';
import { Timestamp } from './adapter/timestamps';

type Type<T> = new (...args: any[]) => T;

type ModelImmutableAttributes =
  | 'type'
  | 'id'
  | 'ref'
  | 'createdAt'
  | 'updatedAt';

type ModelClassAttributes = Readonly<{
  type?: string;
  collection: string;
}>;

type ModelParent<Data extends SnapshotData> = Readonly<{
  model: ModelClass<AnyModel>;
  attribute: keyof Omit<Data, ModelImmutableAttributes>;
}>;

export type InitializeFunction<Data extends SnapshotData, Initializer> = (
  init: Initializer
) => ModelInit<Data>;

export type InitializeFunctionWithBase<
  Base extends ModelImpl,
  Data extends ModelData<Base>,
  Initializer
> = (init: Initializer, base: ModelInit<ModelData<Base>>) => ModelInit<Data>;

export type ModelOptions<
  Data extends SnapshotData,
  Initializer
> = ModelClassAttributes &
  Readonly<{
    /**
     * Metadata about this model's parent.
     */
    parent?: ModelParent<Data>;

    /**
     * An initializing function that converts a model's initializer into
     * its internal data. This method is where data defaults should be
     * set.
     */
    initialize?: InitializeFunction<Data, Initializer>;
  }>;

type ModelData<T extends ModelImpl> = Omit<
  T['snapshot'],
  ModelImmutableAttributes
>;

export type ModelWithBaseOptions<
  Base extends ModelImpl,
  Data extends ModelData<Base>,
  Initializer
> = Readonly<{
  type?: string;
  /**
   * An initializing function that converts a model's initializer into
   * its internal data. This method is where data defaults should be
   * set.
   */
  initialize?: InitializeFunctionWithBase<Base, Data, Initializer>;
}>;

/**
 * A type that accurately represents the interface of typeof AnyModel.
 */
export type ModelClass<T extends AnyModel> = Type<T> &
  ModelOptions<T['snapshot'], any>;

type ModelInit<Data extends SnapshotData> = Omit<
  Data,
  ModelImmutableAttributes
> & {
  type?: string; // should be T["type"] but seems like TS3.9 broke this
  id?: string; // should be T["id"] but seems like TS3.9 broke this
};

/**
 * A reference to another model.
 */
export type ModelRef<T extends AnyModel> = Readonly<{
  type: T['type'];
  id: T['id'];
  ref: DocumentReference<T['snapshot']>;
}>;

export type AnyModel<Data extends SnapshotData = any> = Readonly<{
  type: string;
  id: string;
  ref: DocumentReference<Snapshot<Data>>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  snapshot: Snapshot<Data>;
  updates?: SnapshotUpdates<Data>;
  isNew: boolean;
  toRef(): ModelRef<AnyModel<Data>>;
}>;

type ModelCtrOptions<Data extends SnapshotData> = Readonly<{
  updates?: SnapshotUpdates<Data>;
  isNew?: boolean;
}>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ModelImpl<Data, Initializer> extends Snapshot {}

/**
 * ModelImpl is the base class that provides the core functionality
 * required by any snapdm model.
 */
abstract class ModelImpl<Data extends SnapshotData = any, Initializer = any>
  implements AnyModel<Data> {
  constructor(initializer: Initializer);
  constructor(snapshot: Snapshot<Data>, options?: ModelCtrOptions<Data>);
  constructor(
    initializer: Initializer | Snapshot<Data>,
    options?: ModelCtrOptions<Data>
  ) {
    if (isSnapshot<Snapshot<Data>>(initializer)) {
      this.isNew = options?.isNew ?? false;
      this.updates = options?.updates;
      this.snapshot = initializer;
    } else {
      this.isNew = true;
      this.snapshot = newSnapshot(this.model, initializer);
    }
    return delegate(this, 'snapshot');
  }

  /**
   * Get the current snapshot of the underlying JSON document.
   */
  readonly snapshot: Snapshot<Data>;

  /**
   * A flag indicating if this model is new i.e. it was created from
   * and initializer and not a snapshot.
   */
  readonly isNew: boolean;

  /**
   * An object containing the differences between this object and
   * the object it was copied from. An entity should only be saved if it
   * isNew or its updates are defined. This object can also be used
   * perform a partial update of the underlying document.
   */
  readonly updates?: SnapshotUpdates<Data>;

  /**
   * Meta method for getting the constructor of `this` object to access static
   * methods defined on subclasses, or construct instances of subclasses in
   * the base class.
   */
  readonly model: ModelClass<this> = this.constructor as ModelClass<this>;

  /**
   * Convert this model into a reference object.
   * @returns A ref to this model.
   */
  toRef(): ModelRef<this> {
    const { type, id, ref } = this.snapshot;
    return { type, id, ref };
  }

  /**
   * Creates a new instance of this Model containing the provided
   * updates to the internal snapshot. This method is not intended to be
   * consumed externally to the class and exists primarily to be used as
   * an implementation detail of more domain oriented transformations.
   * @param updates A patch to apply to the current snapshot in creating
   * the new one.
   * @returns A new model with the given patch applied.
   */
  __copy(updates?: DeepPartial<Data>): this {
    // If there we no updates, simply copy the entity.
    if (updates === undefined || updates === {}) {
      return new this.model({ ...this.snapshot });
    }
    // In the presence of updates, update the the updatedAt timestamp,
    // and set the correct `updates` on the new entity.
    const computedUpdates = merge(this.updates, updates, {
      updatedAt: adapter().fieldValues.serverTimestamp(),
    });
    const newValue = merge(this.snapshot, computedUpdates);
    const newEntity = new this.model(newValue, {
      updates: computedUpdates,
      isNew: this.isNew,
    });
    return newEntity;
  }
}

function newSnapshot<T extends AnyModel>(
  type: ModelClass<T>,
  init: unknown
): T['snapshot'] {
  const resource = type.initialize(init);
  if (isUndefined(resource.type)) {
    assertIsDefined(type.type, 'must have modelType defined');
    resource.type = type.type;
  }
  if (isUndefined(resource.id)) {
    resource.id = adapter().ids();
  }
  const now = adapter().fieldValues.serverTimestamp();
  return ({
    ...resource,
    ref: adapter().references(
      type.collection,
      resource.id,
      resolveParentRef(type, resource)
    ),
    createdAt: now,
    updatedAt: now,
  } as unknown) as T;
}

function resolveParentRef<T extends AnyModel>(
  type: ModelClass<T>,
  init: ModelInit<T>
): DocumentReference | undefined {
  if (type.parent) {
    const parentRef = init[type.parent.attribute];
    assert(
      isModelRef(parentRef),
      `parent.attribute value '${type.parent.attribute}' does not point to a ModelRef`
    );
    return parentRef.ref;
  }
  return undefined;
}

function isModelRef(value: unknown): value is ModelRef<AnyModel> {
  const v = value as Partial<ModelRef<AnyModel>>;
  return (
    typeof v.type === 'string' && typeof v.id === 'string' && isDefined(v.ref)
  );
}

/**
 * Mixin function for creating a new model.
 * @param options The options for configuring this model
 * @returns A model class with the provided options mixed int the class.
 */
export function Model<Data extends SnapshotData, Initializer>(
  options: ModelOptions<Data, Initializer>
): ModelClass<ModelImpl<Data, Initializer>>;
export function Model<
  Base extends ModelImpl,
  Data extends ModelData<Base>,
  Initializer
>(
  base: Type<Base>,
  options: ModelWithBaseOptions<Base, Data, Initializer>
): ModelClass<Base>;
export function Model<
  Base extends ModelImpl,
  Data extends SnapshotData,
  Initializer
>(
  baseOrOptions: any,
  options?: ModelWithBaseOptions<Base, Data, Initializer>
): any {
  if (typeof baseOrOptions === 'function') {
    assertIsDefined(options);
    // Initialize with base expects a the model init of its base to that
    // The new initialize data can simply be merged in.
    return class Model extends baseOrOptions {
      static readonly type = options.type;
      static readonly initialize = (init) => {
        return options.initialize(init, baseOrOptions.initialize(init));
      };
    };
  }
  const { type, collection, parent, initialize } = baseOrOptions;
  return class Model extends ModelImpl<Data, Initializer> {
    static readonly type = type;
    static readonly collection = collection;
    static readonly parent = parent;
    static readonly initialize = initialize ?? identity;
  };
}

function identity<T>(e: T): T {
  return e;
}
