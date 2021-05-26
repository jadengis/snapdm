import {
  isDefined,
  isNull,
  isType,
  isUndefined,
  isTruthy,
  isFalsy,
} from "./conditions";

const definedValues = ["", "a defined string", 1, {}];
const truthyValues = ["bob", 1, {}, [], true];
const falsyValues = ["", 0, null, undefined, false, NaN];

class Test {}

describe("Conditions", () => {
  describe("isDefined", () => {
    it("should return false for null", () => {
      const value = null;
      expect(isDefined(value)).toBe(false);
    });

    it("should return false for undefined", () => {
      const value = undefined;
      expect(isDefined(value)).toBe(false);
    });

    definedValues.forEach(value => {
      it(`should return true for '${value}'`, () => {
        expect(isDefined(value)).toBe(true);
      });
    });
  });

  describe("isTruthy", () => {
    truthyValues.forEach(value => {
      it(`should return true for ${value}`, () => {
        expect(isTruthy(value)).toEqual(true);
      });
    });

    falsyValues.forEach(value => {
      it(`should return false for ${value}`, () => {
        expect(isTruthy(value)).toEqual(false);
      });
    });
  });

  describe("isFalsy", () => {
    truthyValues.forEach(value => {
      it(`should return false for ${value}`, () => {
        expect(isFalsy(value)).toEqual(false);
      });
    });

    falsyValues.forEach(value => {
      it(`should return true for ${value}`, () => {
        expect(isFalsy(value)).toEqual(true);
      });
    });
  });

  describe("isUndefined", () => {
    const definedAndNull = [...definedValues, null];
    it("should return true for undefined", () => {
      const value = undefined;
      expect(isUndefined(value)).toBe(true);
    });

    definedAndNull.forEach(value => {
      it(`should return false for '${value}'`, () => {
        expect(isUndefined(value)).toBe(false);
      });
    });
  });

  describe("isNull", () => {
    const definedAndUndefined = [...definedValues, undefined];
    it("should return true for null", () => {
      const value = null;
      expect(isNull(value)).toBe(true);
    });

    definedAndUndefined.forEach(value => {
      it(`should return false for '${value}'`, () => {
        expect(isNull(value)).toBe(false);
      });
    });
  });

  describe("isType", () => {
    it("should return false if not that type", () => {
      const value = { foo: "bar" };
      expect(isType(value, Test)).toBe(false);
    });

    it("should return true if of that type", () => {
      const value = new Test();
      expect(isType(value, Test)).toBe(true);
    });
  });
});
