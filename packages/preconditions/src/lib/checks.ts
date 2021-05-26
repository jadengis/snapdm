import { assertIsDefined } from "./assertions";

export function checkIsDefined<T>(
  value: T | null | undefined,
  message?: string
): T {
  assertIsDefined(value, message);
  return value;
}
