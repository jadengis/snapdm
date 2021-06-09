export function delegate<T extends object>(
  target: T,
  delegateProperty: string
): T {
  return new Proxy(target, {
    get: (t, p) => {
      const prop = coerceToString(p);
      if (p in t) {
        return applyInScope(t[prop], () => t);
      }
      return applyInScope(t[delegateProperty][prop], (thisArg) =>
        thisArg === t ? t[delegateProperty] : thisArg
      );
    },
  });
}

function applyInScope(value: unknown, scope: (thisArg: any) => any) {
  if (typeof value === 'function') {
    return new Proxy(value, {
      apply: (f, thisArg, args) => {
        return f.apply(scope(thisArg), args);
      },
    });
  }
  return value;
}

function coerceToString(p: string | symbol): string {
  if (typeof p === 'string') {
    return p;
  }
  return p.toString();
}
