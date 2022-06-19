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
import { delegate } from './utils/delegate';
import { DocumentReference } from './adapter/references';
import { Timestamp } from './adapter/timestamps';
import { DeepPartial } from 'ts-essentials';
import { merge } from './utils/merge';
import { combine, Validator } from './validator';

type Type<T> = new (...args: any[]) => T;

type AbstractType<T> = abstract new (...args: any[]) => T;

type AnyType<T> = Type<T> | AbstractType<T>;

type ModelIdentifiers = 'type' | 'id' | 'ref';

type ModelImmutableAttributes = ModelIdentifiers | 'createdAt' | 'updatedAt';

export type ModelAttributes<Data extends SnapshotData> = Omit<
  Data,
  ModelImmutableAttributes
>;

type ModelClassAttributes = Readonly<{
  type?: string;
  collection: string;
}>;

type ModelParent<Data extends SnapshotData> = Readonly<{
  // TODO: See if this can be more specific. The additional props are just a soft validation.
  model: Type<AnyModel> & ModelClassAttributes & Readonly<{ parent?: any }>;
  attribute: keyof ModelAttributes<Data>;
}>;

export type InitializeFunction<Data extends SnapshotData, Initializer> = (
  init: Initializer
) => ModelInit<Data>;

export type LazyInitializeFunction<Data extends SnapshotData> =
  () => ModelInit<Data>;

export type InitializeFunctionWithBase<
  Base extends RootModel & AnyModel,
  Data extends ModelData<Base>,
  Initializer
  > = (init: Initializer) => ModelInit<Data>;

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

    /**
     * An optional list of validators to apply to the model's snapshot
     * before writing it to the database.
     */
    validators?: Validator<Data>[];
  }>;

type ModelData<T extends RootModel & AnyModel> = Omit<
  T['snapshot'],
  ModelImmutableAttributes
>;

type ModelWithBaseOptions<
  Base extends RootModel & AnyModel,
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

    /**
     * An optional list of validators to apply to the model's snapshot
     * before writing it to the database.
     */
    validators?: Validator<Data>[];
  }>;

export type ExtendedModelOptions<
  Base extends RootModel & AnyModel,
  Data extends ModelData<Base>,
  Initializer
  > = Readonly<{
    extends: AnyType<Base>;
  }> &
  ModelWithBaseOptions<Base, Data, Initializer>;

function isExtendModelOptions<
  Base extends AnyModel,
  Data extends ModelData<Base>,
  Initializer
>(value: unknown): value is ExtendedModelOptions<Base, Data, Initializer> {
  const v = value as Partial<ExtendedModelOptions<Base, Data, Initializer>>;
  return typeof v.extends === 'function';
}

/**
 * A type that accurately represents the interface of typeof AnyModel.
 */
export type ModelClass<T extends AnyModel> = Type<T> &
  Exclude<ModelOptions<T['snapshot'], any>, 'validators'> &
  Readonly<{
    validator: Validator<T['snapshot']>;
  }>;

export type AnyModelClass<T extends AnyModel> = AnyType<T> &
  Exclude<ModelOptions<T['snapshot'], any>, 'validators'> &
  Readonly<{
    validator: Validator<T['snapshot']>;
  }>;

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
  type: string;
  id: string;
  ref: DocumentReference<T['snapshot']>;
}>;

export interface AnyModel<Data extends SnapshotData = object> {
  readonly type: string;
  readonly id: string;
  readonly ref: DocumentReference<Snapshot<Data>>;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly snapshot: Snapshot<Data>;
  readonly updates?: SnapshotUpdates<Data>;
  readonly isNew: boolean;
  toRef<Keys extends keyof Data>(
    ...includeAttributes: Keys[]
  ): ModelRef<AnyModel<Data>> & Pick<Data, Keys>;
}

type ModelCtrOptions<Data extends SnapshotData> = Readonly<{
  updates?: SnapshotUpdates<Data>;
  isNew?: boolean;
}>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface RootModel extends Snapshot { }

abstract class RootModel {
  constructor(initializer);
  constructor(snapshot, options?);
  constructor(initializer, options?) {
    if (isSnapshot<Snapshot>(initializer)) {
      /* @ts-ignore */
      this.isNew = options?.isNew ?? false;
      /* @ts-ignore */
      this.updates = options?.updates;
      /* @ts-ignore */
      this.snapshot = initializer;
    } else {
      /* @ts-ignore */
      this.isNew = true;
      /* @ts-ignore */
      this.snapshot = newSnapshot(this.constructor, initializer) as any; // TODO: Remove typehack.
    }
    return delegate(this, 'snapshot');
  }
}

/**
 * Mixin function for creating a new model.
 * @param options The options for configuring this model
 * @returns A model class with the provided options mixed int the class.
 */
export function Model<
  Data extends ModelData<Base>,
  Initializer,
  Base extends RootModel & AnyModel = any
>(
  options:
    | ModelOptions<Data, Initializer>
    | ExtendedModelOptions<Base, Data, Initializer>
) {
  const { type, initialize, validators } = options;
  let baseClass: typeof RootModel;
  let collection: string;
  let parent: ModelParent<Data> | undefined;
  let validator: Validator<Data>;
  if (isExtendModelOptions(options)) {
    baseClass = options.extends;
    collection = (options.extends as any).collection;
    parent = (options.extends as any).parent;
    const extendValidator = (options.extends as any).validator;
    validator = validators
      ? combine([...validators, extendValidator])
      : extendValidator;
  } else {
    baseClass = RootModel;
    collection = options.collection;
    parent = options.parent;
    validator = validators ? combine(validators) : () => null;
  }
  return class Model extends baseClass implements AnyModel<Data> {
    static readonly type = type;
    static readonly collection = collection;
    static readonly parent = parent;
    static readonly initialize = initialize ?? identity;
    static readonly validator = validator;

    constructor(init: Initializer);
    constructor(snapshot: Snapshot<Data>, options?: ModelCtrOptions<Data>);
    constructor(
      init: Snapshot<Data> | Initializer,
      options?: ModelCtrOptions<Data>
    ) {
      super(init, options);
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
     * @param includeAttributes Optional fields in this model to include in the reference.
     * @returns A ref to this model.
     */
    toRef<Keys extends keyof this['snapshot']>(
      ...includeAttributes: Keys[]
    ): ModelRef<this> & Pick<this['snapshot'], Keys> {
      // TODO: Remove these escape hatches
      const { type, id, ref } = this.snapshot;
      return includeAttributes
        .map((k) => [k, this.snapshot[k as any]])
        .reduce(
          (o, [k, v]) => {
            o[k] = v;
            return o;
          },
          { type, id, ref } as any
        );
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
    clone(updates?: DeepPartial<Data>): this {
      // If there we no updates, simply copy the entity.
      if (updates === undefined || Object.keys(updates).length === 0) {
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
  };
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
  return {
    ...resource,
    ref: adapter().references(
      type.collection,
      resource.id,
      resolveParentRef(type, resource)
    ),
    createdAt: now,
    updatedAt: now,
  } as unknown as T;
}

function resolveParentRef<T extends AnyModel>(
  type: ModelClass<T>,
  init: ModelInit<T['snapshot']>
): DocumentReference | undefined {
  if (type.parent) {
    const parentRef = init[type.parent.attribute];
    assert(
      isModelRef(parentRef),
      `parent.attribute value '${String(
        type.parent.attribute
      )}' does not point to a ModelRef`
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

function identity<T>(e: T): T {
  return e;
}
