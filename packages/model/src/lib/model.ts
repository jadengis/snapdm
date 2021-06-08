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

type Type<T> = new (...args: any[]) => T;

type ModelImmutableAttributes =
  | 'type'
  | 'id'
  | 'ref'
  | 'createdAt'
  | 'updatedAt';

type ModelClassAttributes = Readonly<{
  collection: string;
  type?: string;
  prefix?: string;
}>;

type ModelParent<Data extends SnapshotData> = Readonly<{
  model: ModelClass<AnyModel>;
  attribute: keyof Omit<Data, ModelImmutableAttributes>;
}>;

export type InitializeFunction<Data extends SnapshotData, Initializer> = (
  init: Initializer
) => ModelInit<Data>;

export type ModelOptions<
  Data extends SnapshotData,
  Initializer
> = ModelClassAttributes &
  Readonly<{
    /**
     * An initializing function that converts a model's initializer into
     * its internal data. This method is where data defaults should be
     * set.
     */
    initialize: InitializeFunction<Data, Initializer>;

    /**
     * Metadata about this model's parent.
     */
    parent?: ModelParent<Data>;
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface AnyModel<Data, Initializer> extends Snapshot {}

/**
 * AnyModel is the base class that provides the core functionality
 * required by any snapdm model.
 */
export abstract class AnyModel<
  Data extends SnapshotData = any,
  Initializer = any
> {
  constructor(initializer: Initializer | Snapshot<Data>) {
    if (isSnapshot<Snapshot<Data>>(initializer)) {
      this.__isNew = false;
      this.__value = initializer;
    } else {
      this.__isNew = true;
      this.__value = newSnapshot(this.__type, initializer);
    }
    return delegate(this, 'snapshot');
  }

  private readonly __value: Snapshot<Data>;

  private __isNew: boolean;

  private __updates?: SnapshotUpdates<Data>;

  /**
   * Meta method for getting the constructor of `this` object to access static
   * methods defined on subclasses, or construct instances of subclasses in
   * the base class.
   */
  private readonly __type: ModelClass<this> = this
    .constructor as ModelClass<this>;

  /**
   * Get the current snapshot of the underlying JSON document.
   */
  get snapshot(): Snapshot<Data> {
    return this.__value;
  }

  /**
   * An object containing the differences between this object and
   * the object it was copied from. An entity should only be saved if it
   * isNew or its updates are defined. This object can also be used
   * perform a partial update of the underlying document.
   */
  get updates(): SnapshotUpdates<Data> | undefined {
    return this.__updates;
  }

  /**
   * A flag indicating if this model is new i.e. it was created from
   * and initializer and not a snapshot.
   */
  get isNew(): boolean {
    return this.__isNew;
  }

  /**
   * Convert this model into a reference object.
   * @returns A ref to this model.
   */
  toRef(): ModelRef<this> {
    return {
      type: this.type,
      id: this.id,
      ref: this.ref,
    };
  }

  protected __copy(updates?: DeepPartial<Data>): this {
    // If there we no updates, simply copy the entity.
    if (updates === undefined || updates === {}) {
      return new this.__type({ ...this.snapshot });
    }
    // In the presence of updates, update the the updatedAt timestamp,
    // and set the correct `updates` on the new entity.
    const computedUpdates = merge(this.__updates, updates, {
      updatedAt: adapter().fieldValues.serverTimestamp(),
    });
    const newValue = merge(this.snapshot, computedUpdates);
    const newEntity = new this.__type(newValue);
    newEntity.__updates = computedUpdates;
    newEntity.__isNew = this.isNew;
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
    assertIsDefined(type.prefix);
    resource.id = `${type.prefix}-${adapter().ids()}`;
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
      `parent.attribute value '${type.parent.attribute} does not point to a ModelRef`
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
export default function <Data extends SnapshotData, Initializer>({
  collection,
  initialize,
  parent,
  prefix,
  type,
}: ModelOptions<Data, Initializer>) {
  // This mixin is exported as default to work around a stupid typing issue where
  // mixin functions can't have private / protected props.
  // https://github.com/microsoft/TypeScript/issues/30355
  return class Model extends AnyModel<Data, Initializer> {
    static readonly type = type;
    static readonly collection = collection;
    static readonly prefix = prefix;
    static readonly parent = parent;
    static readonly initialize = initialize;
  };
}
