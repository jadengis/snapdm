import {
  PreconditionFailedError,
  assertIsDefined,
  assertIsType,
  assertIsUndefined,
  assertIsNull,
  assertIsBoolean,
  assertIsNumber,
  assertIsString,
  assertIsFunction,
  assertIsObject,
} from "./assertions";

const definedValues = ["", "a defined string", 1, {}];
const undefinedValues = [null, undefined];

class Test {}

describe("Assertions", () => {
  describe("assertIsDefined", () => {
    definedValues.forEach(value => itNotThrows(assertIsDefined, value));
    undefinedValues.forEach(value => itThrows(assertIsDefined, value));
  });

  describe("assertIsUndefined", () => {
    [undefined].forEach(value => itNotThrows(assertIsUndefined, value));
    [...definedValues, null].forEach(value =>
      itThrows(assertIsUndefined, value)
    );
  });

  describe("assertIsNull", () => {
    [null].forEach(value => itNotThrows(assertIsNull, value));
    [...definedValues, undefined].forEach(value =>
      itThrows(assertIsNull, value)
    );
  });

  describe("assertIsString", () => {
    ["", "a string"].forEach(value => itNotThrows(assertIsString, value));
    [true, 1, {}, []].forEach(value => itThrows(assertIsString, value));
  });

  describe("assertIsNumber", () => {
    [0, 1, 2, 2.5].forEach(value => itNotThrows(assertIsNumber, value));
    [true, "", "value", {}, []].forEach(value =>
      itThrows(assertIsNumber, value)
    );
  });

  describe("assertIsFunction", () => {
    [() => 5].forEach(value => itNotThrows(assertIsFunction, value));
    ["value", 1, {}, []].forEach(value => itThrows(assertIsFunction, value));
  });

  describe("assertIsBoolean", () => {
    [true, false].forEach(value => itNotThrows(assertIsBoolean, value));
    ["value", 1, {}, []].forEach(value => itThrows(assertIsBoolean, value));
  });

  describe("assertIsObject", () => {
    [{}, { foo: "bar" }].forEach(value => itNotThrows(assertIsObject, value));
    ["value", 1, true].forEach(value => itThrows(assertIsObject, value));
  });

  describe("assertIsType", () => {
    it("should throw if not that type", () => {
      const value = { foo: "bar" };
      expect(() => assertIsType(value, Test)).toThrowError(
        PreconditionFailedError
      );
    });

    it("should not throw if of that type", () => {
      const value = new Test();
      expect(() => assertIsType(value, Test)).not.toThrowError(
        PreconditionFailedError
      );
    });
  });
});

function itThrows(assertion: (value: unknown) => void, value: unknown): void {
  it(`should throw for value '${value}'`, () => {
    expect(() => assertion(value)).toThrowError(PreconditionFailedError);
  });
}

function itNotThrows(
  assertion: (value: unknown) => void,
  value: unknown
): void {
  it(`should not throw for value '${value}'`, () => {
    expect(() => assertion(value)).not.toThrowError(PreconditionFailedError);
  });
}
