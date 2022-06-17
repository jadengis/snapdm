import __mergeWith from 'lodash/mergeWith';

export function merge<T1, T2>(t1: T1, t2: T2): T1 & T2;
export function merge<T1, T2, T3>(t1: T1, t2: T2, t3: T3): T1 & T2 & T3;
export function merge<T1, T2, T3, T4>(
  t1: T1,
  t2: T2,
  t3: T3,
  t4: T4
): T1 & T2 & T3 & T4;
export function merge(...sources: unknown[]): unknown {
  return __mergeWith({}, ...sources, (obj: unknown, val: unknown) =>
    Array.isArray(obj) ? val : undefined
  );
}
