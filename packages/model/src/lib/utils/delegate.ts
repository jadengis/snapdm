export function delegate<T extends object>(
  target: T,
  delegateProperty: string
): T {
  return new Proxy(target, {
    get: (t, p) => {
      const prop = coerceToString(p);
      if (p in t) {
        const value = t[prop];
        if (typeof value === 'function') {
          return new Proxy(value, {
            apply: (f, _, args) => {
              return f.apply(t, args);
            },
          });
        }
        return t[prop];
      }
      const value = t[delegateProperty][prop];
      if (typeof value === 'function') {
        // if it is a function, proxy it so that scope is correct
        return new Proxy(value, {
          apply: (f, thisArg, args) => {
            // if trying to call on target, then use delegate
            // else call on provided thisArg
            const scope = thisArg === t ? t[delegateProperty] : thisArg;
            return f.apply(scope, args);
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
