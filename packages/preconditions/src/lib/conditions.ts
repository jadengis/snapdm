import { Type } from "./type";

/**
 * A Predicate is a function that takes a value, with some optional other values,
 * and determines whether the given value satifies a type predicate.
 */
export type Predicate<T> = (value: unknown, ...others: unknown[]) => value is T;

/**
 * This condition checks the whether the given value is defined or not.
 * @param value Value to check is defined.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function isTruthy<T>(
  value: T | "" | null | undefined | 0 | 0n | false
): value is T {
  return !!value;
}

export function isFalsy<T>(
  value: T | "" | null | undefined | 0 | 0n | false
): value is "" | null | undefined | 0 | 0n | false {
  return !value;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isBigInt(value: unknown): value is bigint {
  return typeof value === "bigint";
}

export function isFunction(value: unknown): value is Function {
  return typeof value === "function";
}

export function isObject(value: unknown): value is object {
  return typeof value === "object";
}

export function isType<T>(value: unknown, type: Type<T>): value is T {
  return value instanceof type;
}
