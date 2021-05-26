import {
  Predicate,
  isBigInt,
  isBoolean,
  isDefined,
  isFunction,
  isNull,
  isNumber,
  isObject,
  isString,
  isType,
  isUndefined,
} from "./conditions";
import { Type } from "./type";

/**
 * PreconditionFailedError is an error to throw when a precondition fails.
 */
export class PreconditionFailedError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "PreconditionFailedError";
  }
}

export function assert<T extends boolean>(
  condition: T,
  message?: string
): asserts condition {
  if (!condition) {
    throw new PreconditionFailedError(message);
  }
}

export function assertPredicate<T>(
  condition: Predicate<T>,
  value: unknown,
  message?: string
): asserts value is T {
  assert(condition(value), message);
}

export function assertIsDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  assertPredicate(isDefined, value, message);
}

export function assertIsUndefined(
  value: unknown,
  message?: string
): asserts value is undefined {
  assertPredicate(isUndefined, value, message);
}

export function assertIsNull(
  value: unknown,
  message?: string
): asserts value is null {
  assertPredicate(isNull, value, message);
}

export function assertIsBoolean(
  value: unknown,
  message?: string
): asserts value is boolean {
  assertPredicate(isBoolean, value, message);
}

export function assertIsString(
  value: unknown,
  message?: string
): asserts value is string {
  assertPredicate(isString, value, message);
}

export function assertIsNumber(
  value: unknown,
  message?: string
): asserts value is number {
  assertPredicate(isNumber, value, message);
}

export function assertIsBigInt(
  value: unknown,
  message?: string
): asserts value is bigint {
  assertPredicate(isBigInt, value, message);
}

export function assertIsFunction(
  value: unknown,
  message?: string
): asserts value is Function {
  assertPredicate(isFunction, value, message);
}

export function assertIsObject(
  value: unknown,
  message?: string
): asserts value is object {
  assertPredicate(isObject, value, message);
}

export function assertIsType<T>(
  value: unknown,
  type: Type<T>,
  message?: string
): asserts value is T {
  assert(isType(value, type), message);
}
