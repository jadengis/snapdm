import {
  Snapshot,
  PreSnapshot,
  SnapshotUpdates,
  isSnapshot,
  SnapshotDefinition,
} from './snapshot';
import { isUndefined, assertIsDefined } from '@snapdm/preconditions';
import * as ids from './ids';
import { Timestamp } from './timestamp';
import { fieldValue } from './field-value';
import { merge } from './utils/merge';
import { DeepPartial } from 'ts-essentials';

export type Type<T> = new (...args: unknown[]) => T;

export type AbstractModelClass = Readonly<{
  collection: string;
  type?: string;
  prefix?: string;
}>;

export type ModelClass<T extends AnyModel> = Type<T> & AbstractModelClass;

type InitFunction<T extends AnyModel> = (
  init: unknown
) => PreSnapshot<T['snapshot']>;

type InitializableModel<T extends AnyModel> = Readonly<{
  initializer: InitFunction<T>;
}>;

type InitializableModelClass<T extends AnyModel> = ModelClass<T> &
  InitializableModel<T>;

export type AnyModel = SnapdmModel<any, unknown>;

export abstract class SnapdmModel<
  Definition extends SnapshotDefinition,
  Initializer
> {
  constructor(initializer: Initializer | Snapshot<Definition>) {
    if (isSnapshot<Snapshot<Definition>>(initializer)) {
      this._isNew = false;
      this._value = initializer;
    } else {
      const { type, prefix } = this._type;
      this._isNew = true;
      this._value = _newSnapshot(
        this._type.initializer(initializer),
        type,
        prefix
      );
    }
  }

  private readonly _value: Snapshot<Definition>;

  /**
   * A flag indicating if this model is new i.e. it was created from
   * and initializer and not a snapshot.
   */
  private _isNew: boolean;

  /**
   * An object containing the differences between this object and
   * the object it was copied from. An entity should only be saved if it
   * isNew or its updates are defined.
   */
  private _updates?: SnapshotUpdates<Definition['data']>;

  get type(): Definition['type'] {
    return this.snapshot.type;
  }

  get id(): string {
    return this.snapshot.id;
  }

  get createdAt(): Timestamp {
    return this.snapshot.createdAt;
  }

  get updatedAt(): Timestamp {
    return this.snapshot.updatedAt;
  }

  /**
   * Get the current snapshot of the underlying JSON document.
   */
  get snapshot(): Snapshot<Definition> {
    return this._value;
  }

  get updates(): SnapshotUpdates<Definition['data']> | undefined {
    return this._updates;
  }

  get isNew(): boolean {
    return this._isNew;
  }

  /**
   * Returns a new snapshot with the given patch applied.
   * @param updates A deep partial of the model data.
   * @returns A copy of this snapshot with the given patch applied.
   */
  update(updates: DeepPartial<Definition['data']>): this {
    return this.copy(updates);
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

  protected copy(updates?: DeepPartial<Definition['data']>): this {
    // If there we no updates, simply copy the entity.
    if (updates === undefined || updates === {}) {
      return new this._type({ ...this.snapshot });
    }
    // In the presence of updates, update the the updatedAt timestamp,
    // and set the correct `updates` on the new entity.
    const computedUpdates = merge(this._updates, updates, {
      updatedAt: fieldValue().serverTimestamp(),
    });
    const newValue = merge(this.snapshot, computedUpdates);
    const newEntity = new this._type(newValue);
    newEntity._updates = computedUpdates;
    newEntity._isNew = this.isNew;
    return newEntity;
  }

  /**
   * Meta method for getting the constructor of `this` object to access static
   * methods defined on subclasses, or construct instances of subclasses in
   * the base class.
   */
  private get _type(): InitializableModelClass<this> {
    return this.constructor as InitializableModelClass<this>;
  }
}

export type ModelRef<T extends AnyModel> = Readonly<{
  type: T['type'];
  id: T['id'];
}>;

function _newSnapshot<T extends Snapshot>(
  resource: PreSnapshot<T>,
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
