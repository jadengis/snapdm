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

type ModelImmutableAttributes =
  | 'type'
  | 'id'
  | 'ref'
  | 'createdAt'
  | 'updatedAt';

type Type<T> = new (...args: any[]) => T;

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
    initialize: InitializeFunction<Data, Initializer>;
    parent?: ModelParent<Data>;
  }>;

export type ModelClass<T extends AnyModel> = Type<T> &
  ModelOptions<T['snapshot'], any>;

type ModelInit<Data extends SnapshotData> = Omit<
  Data,
  ModelImmutableAttributes
> & {
  type?: string; // should be T["type"] but seems like TS3.9 broke this
  id?: string; // should be T["id"] but seems like TS3.9 broke this
};

export type ModelRef<T extends AnyModel> = Readonly<{
  type: T['type'];
  id: T['id'];
  ref: DocumentReference<T['snapshot']>;
}>;

export type AnyModel = __Model;

export function Model<Data extends SnapshotData, Initializer>({
  collection,
  initialize,
  parent,
  prefix,
  type,
}: ModelOptions<Data, Initializer>) {
  return class Model extends __Model<Data, Initializer> {
    static readonly type = type;
    static readonly collection = collection;
    static readonly prefix = prefix;
    static readonly parent = parent;
    static readonly initialize = initialize;
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface __Model<Data, Initializer> extends Snapshot {}

abstract class __Model<Data extends SnapshotData = any, Initializer = any> {
  constructor(initializer: Initializer | Snapshot<Data>) {
    if (isSnapshot<Snapshot<Data>>(initializer)) {
      this.#isNew = false;
      this.#value = initializer;
    } else {
      this.#isNew = true;
      this.#value = newSnapshot(this.#type, initializer);
    }
    return delegate(this, 'snapshot');
  }

  readonly #value: Snapshot<Data>;

  /**
   * A flag indicating if this model is new i.e. it was created from
   * and initializer and not a snapshot.
   */
  #isNew: boolean;

  /**
   * An object containing the differences between this object and
   * the object it was copied from. An entity should only be saved if it
   * isNew or its updates are defined.
   */
  #updates?: SnapshotUpdates<Data>;

  /**
   * Meta method for getting the constructor of `this` object to access static
   * methods defined on subclasses, or construct instances of subclasses in
   * the base class.
   */
  #type: ModelClass<this> = this.constructor as ModelClass<this>;

  /**
   * Get the current snapshot of the underlying JSON document.
   */
  get snapshot(): Snapshot<Data> {
    return this.#value;
  }

  get updates(): SnapshotUpdates<Data> | undefined {
    return this.#updates;
  }

  get isNew(): boolean {
    return this.#isNew;
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

  __copy(updates?: DeepPartial<Data>): this {
    // If there we no updates, simply copy the entity.
    if (updates === undefined || updates === {}) {
      return new this.#type({ ...this.snapshot });
    }
    // In the presence of updates, update the the updatedAt timestamp,
    // and set the correct `updates` on the new entity.
    const computedUpdates = merge(this.#updates, updates, {
      updatedAt: adapter().fieldValues.serverTimestamp(),
    });
    const newValue = merge(this.snapshot, computedUpdates);
    const newEntity = new this.#type(newValue);
    newEntity.#updates = computedUpdates;
    newEntity.#isNew = this.isNew;
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
