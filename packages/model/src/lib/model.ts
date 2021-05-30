import {
  Snapshot,
  SnapshotData,
  SnapshotUpdates,
  isSnapshot,
} from './snapshot';
import { isUndefined, assertIsDefined } from '@snapdm/preconditions';
import { adapter } from './adapter';
import { merge } from './utils/merge';
import { DeepPartial } from 'ts-essentials';
import { delegate } from './utils/delegate';
import { DocumentReference } from './adapter/references';

type Type<T> = new (...args: any[]) => T;

type ModelClassAttributes = Readonly<{
  collection: string;
  type?: string;
  prefix?: string;
}>;

type InitFunction<T extends Model> = (
  init: unknown
) => ModelInit<T['snapshot']>;

type ParentSelector<T extends Model> = (child: ModelInit<T>) => ModelRef<Model>;

export type ModelClass<T extends Model> = Type<T> &
  ModelClassAttributes &
  Readonly<{
    initializer: InitFunction<T>;
    parent?: ParentSelector<T>;
  }>;

export type ModelInit<T extends Snapshot> = Omit<
  T,
  'type' | 'id' | 'ref' | 'createdAt' | 'updatedAt'
> & {
  type?: string; // should be T["type"] but seems like TS3.9 broke this
  id?: string; // should be T["id"] but seems like TS3.9 broke this
};

export type ModelRef<T extends Model> = Readonly<{
  type: T['type'];
  id: T['id'];
  ref: DocumentReference<T['snapshot']>;
}>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Model<Data, Initializer> extends Snapshot {}

export abstract class Model<
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
    return delegate(this, '__value');
  }

  private readonly __value: Snapshot<Data>;

  /**
   * A flag indicating if this model is new i.e. it was created from
   * and initializer and not a snapshot.
   */
  private __isNew: boolean;

  /**
   * An object containing the differences between this object and
   * the object it was copied from. An entity should only be saved if it
   * isNew or its updates are defined.
   */
  private __updates?: SnapshotUpdates<Data>;

  /**
   * Get the current snapshot of the underlying JSON document.
   */
  get snapshot(): Snapshot<Data> {
    return this.__value;
  }

  get updates(): SnapshotUpdates<Data> | undefined {
    return this.__updates;
  }

  get isNew(): boolean {
    return this.__isNew;
  }

  /**
   *
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

  /**
   * Meta method for getting the constructor of `this` object to access static
   * methods defined on subclasses, or construct instances of subclasses in
   * the base class.
   */
  private get __type(): ModelClass<this> {
    return this.constructor as ModelClass<this>;
  }
}

function newSnapshot<T extends Model>(
  type: ModelClass<T>,
  init: unknown
): T['snapshot'] {
  const resource = type.initializer(init);
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
      type.parent ? type.parent(resource).ref : undefined
    ),
    createdAt: now,
    updatedAt: now,
  } as unknown) as T;
}
