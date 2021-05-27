export function delegate<T extends object>(
  target: T,
  delegateProperty: string
): T {
  return new Proxy(target, {
    get: (t, p) => {
      const prop = coerceToString(p);
      if (p in t) return t[prop];
      const value = target[delegateProperty][prop];
      if (typeof value === 'function') {
        // if it is a function, proxy it so that scope is correct
        return new Proxy(value, {
          apply: (f, thisArg, argumentsList) => {
            // if trying to call on target, then use delegate
            // else call on provided thisArg
            const scope =
              thisArg === target ? target[delegateProperty] : thisArg;
            return f.apply(scope, argumentsList);
          },
        });
      }
      return value;
    },
  });
}

function coerceToString(p: string | symbol): string {
  if (typeof p === 'string') {
    return p;
  }
  return p.toString();
}
