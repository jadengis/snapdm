import { Timestamp } from './timestamp';
import type { DeepPartial } from 'ts-essentials';

type SnapshotData = Record<string, unknown>;

export type SnapshotDefinition = Readonly<{
  type: string;
  data: SnapshotData;
}>;

/**
 * A document snapshot model.
 */
export type Snapshot<
  T extends SnapshotDefinition = SnapshotDefinition
> = Readonly<{
  type: T['type'];
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}> &
  T['data'];

type Timestamps = 'createdAt' | 'updatedAt';

export type PreSnapshot<T extends Snapshot> = Omit<
  T,
  'type' | 'id' | Timestamps
> & {
  type?: string; // should be T["type"] but seems like TS3.9 broke this
  id?: string; // should be T["id"] but seems like TS3.9 broke this
};

export function isSnapshot<T extends Snapshot>(value: unknown): value is T {
  const v = value as Partial<Snapshot>;
  return (
    typeof v.type === 'string' &&
    typeof v.id === 'string' &&
    typeof v.createdAt !== 'undefined' &&
    typeof v.updatedAt !== 'undefined'
  );
}

export type SnapshotUpdates<Data = SnapshotData> = {
  readonly updatedAt: Timestamp;
} & DeepPartial<Data>;
