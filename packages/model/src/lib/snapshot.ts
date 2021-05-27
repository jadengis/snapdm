import { Timestamp } from './timestamp';
import type { DeepPartial } from 'ts-essentials';

export type SnapshotData = object;

/**
 * A document snapshot model.
 */
export type Snapshot<T extends SnapshotData = SnapshotData> = Readonly<{
  type: string;
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}> &
  T;

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
