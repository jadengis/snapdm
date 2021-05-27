import {
  Snapshot,
  SnapshotData,
  SnapshotUpdates,
  isSnapshot,
} from './snapshot';
import { isUndefined, assertIsDefined } from '@snapdm/preconditions';
import * as ids from './ids';
import { fieldValue } from './field-value';
import { merge } from './utils/merge';
import { DeepPartial } from 'ts-essentials';
import { delegate } from './utils/delegate';

type Type<T> = new (...args: unknown[]) => T;

type AbstractModelClass = Readonly<{
  collection: string;
  type?: string;
  prefix?: string;
}>;

type ModelClass<T extends AnyModel> = Type<T> & AbstractModelClass;

type InitFunction<T extends AnyModel> = (
  init: unknown
) => ModelInit<T['snapshot']>;

type InitializableModel<T extends AnyModel> = Readonly<{
  initializer: InitFunction<T>;
}>;

type InitializableModelClass<T extends AnyModel> = ModelClass<T> &
  InitializableModel<T>;

type AnyModel = Model<any, unknown>;

export type ModelInit<T extends Snapshot> = Omit<
  T,
  'type' | 'id' | 'createdAt' | 'updatedAt'
> & {
  type?: string; // should be T["type"] but seems like TS3.9 broke this
  id?: string; // should be T["id"] but seems like TS3.9 broke this
};

export type ModelRef<T extends AnyModel> = Readonly<{
  type: T['type'];
  id: T['id'];
}>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Model<Data, Initializer> extends Snapshot {}

export abstract class Model<Data extends SnapshotData, Initializer> {
  constructor(initializer: Initializer | Snapshot<Data>) {
    if (isSnapshot<Snapshot<Data>>(initializer)) {
      this.__isNew = false;
      this.__value = initializer;
    } else {
      const { type, prefix } = this.__type;
      this.__isNew = true;
      this.__value = newSnapshot(
        this.__type.initializer(initializer),
        type,
        prefix
      );
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
      updatedAt: fieldValue().serverTimestamp(),
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
  private get __type(): InitializableModelClass<this> {
    return this.constructor as InitializableModelClass<this>;
  }
}

function newSnapshot<T extends Snapshot>(
  resource: ModelInit<T>,
  modelType: string | undefined,
  prefix?: string
): T {
  if (isUndefined(resource.type)) {
    assertIsDefined(modelType, 'must have modelType defined');
    resource.type = modelType;
  }
  if (isUndefined(resource.id)) {
    assertIsDefined(prefix);
    resource.id = `${prefix ? `${prefix}-` : ''}${ids.generateId()}`;
  }
  const now = fieldValue().serverTimestamp();
  return ({
    ...resource,
    createdAt: now,
    updatedAt: now,
  } as unknown) as T;
}
