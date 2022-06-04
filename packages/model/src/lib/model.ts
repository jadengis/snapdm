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
  model: ModelClass<any>;
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
  > = (
    init: Initializer,
  ) => ModelInit<Data>;

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

type ModelData<T extends RootModel & AnyModel> = Omit<
  T["snapshot"],
  ModelImmutableAttributes
>

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
    initialize?: InitializeFunctionWithBase<Base, Data, Initializer>
  }>;

export type ExtendedModelOptions<
  Base extends RootModel & AnyModel,
  Data extends ModelData<Base>,
  Initializer
  > = Readonly<{
    extends: AnyType<Base>;
  }> & ModelWithBaseOptions<Base, Data, Initializer>;

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
  ModelOptions<T['snapshot'], any>;

export type AnyModelClass<T extends AnyModel> = AnyType<T> & ModelOptions<T["snapshot"], any>

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
    constructor(initializer: object);
    constructor(snapshot: object, options?);
    constructor(
      initializer,
      options?
    ) {
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
 * ModelImpl is the base class that provides the core functionality
 * required by any snapdm model.
 */
export function Model<Data extends ModelData<Base>, Initializer, Base extends RootModel & AnyModel = any>(options: ModelOptions<Data, Initializer> | ExtendedModelOptions<Base, Data, Initializer>)  {
  const {type, initialize} = options
  let baseClass: typeof RootModel
  let collection: string;
  let parent: ModelParent<Data> | undefined;
  if(isExtendModelOptions((options))) {
    baseClass = options.extends;
    collection = (options.extends as any).collection
    parent = (options.extends as any).parent
  } else {
    baseClass = RootModel;
    collection = options.collection
    parent = options.parent
  }
  return class Model extends baseClass
    implements AnyModel<Data>
  {
    static readonly type = type;
    static readonly collection = collection;
    static readonly parent = parent;
    static readonly initialize = initialize ?? identity;

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
  init: ModelInit<T["snapshot"]>
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

/**
 * Mixin function for creating a new model.
 * @param options The options for configuring this model
 * @returns A model class with the provided options mixed int the class.
 */
// export function Model<Data extends SnapshotData, Initializer>(
//   options: ModelOptions<Data, Initializer>
// ): ConstructableModel<Data, Initializer, AnyModel<Data>>;
// export function Model<
//   Base extends AnyModel<any>,
//   Data extends ModelData<Base>,
//   Initializer
// >(
//   options: ExtendedModelOptions<Base, Data, Initializer>
// ): ConstructableModel<Data, Initializer, Base>;
// export function Model<
//   Base extends AnyModel,
//   Data extends ModelData<Base>,
//   Initializer
// >(
//   options:
//     | ModelOptions<Data, Initializer>
//     | ExtendedModelOptions<Base, Data, Initializer>
// ): any {
//   if (isExtendModelOptions(options)) {
//     const {
//       extends: base,
//       options: { type, initialize },
//     } = options;
//     // Initialize with base expects a the model init of its base to that
//     // The new initialize data can simply be merged in.
//     return class Model extends base {
//       static readonly type = type;
//       static readonly initialize = (init) => {
//         return initialize(init, () => (base as any).initialize(init));
//       };
//     };
//   }
//   const { type, collection, parent, initialize } = options;
//   return class Model extends ModelImpl<Data, Initializer> {
//     static readonly type = type;
//     static readonly collection = collection;
//     static readonly parent = parent;
//     static readonly initialize = initialize ?? identity;
//   };
// }

function identity<T>(e: T): T {
  return e;
}
