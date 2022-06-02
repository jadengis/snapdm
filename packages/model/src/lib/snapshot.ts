import { Timestamp } from './adapter/timestamps';
import type { DeepPartial } from 'ts-essentials';
import { DocumentReference } from './adapter/references';

export type SnapshotData = object;

type SnapshotAttributes<T extends SnapshotData = SnapshotData> = Readonly<{
  type: string;
  id: string;
  ref: DocumentReference<Snapshot<T>>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}>;

/**
 * A document snapshot model.
 */
export type Snapshot<T extends SnapshotData = SnapshotData> =
  SnapshotAttributes<T> & T;

export function isSnapshot<T extends Snapshot>(value: unknown): value is T {
  const v = value as Partial<Snapshot>;
  return (
    typeof v.type === 'string' &&
    typeof v.id === 'string' &&
    typeof v.ref !== 'undefined' &&
    typeof v.createdAt !== 'undefined' &&
    typeof v.updatedAt !== 'undefined'
  );
}

export type SnapshotUpdates<Data = SnapshotData> = {
  readonly updatedAt: Timestamp;
} & DeepPartial<Data>;
