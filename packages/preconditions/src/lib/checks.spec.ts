import { checkIsDefined } from "./checks";
import { PreconditionFailedError } from "./assertions";

const definedValues = ["", "a defined string", 1, {}];
const undefinedValues = [null, undefined];

describe("Checks", () => {
  describe("checkIsDefined", () => {
    definedValues.forEach(value => {
      describe(`for input ${value}`, () => {
        it("should not throw and pass the value through", () => {
          expect(checkIsDefined(value)).toEqual(value);
        });
      });
    });

    undefinedValues.forEach(value => {
      describe(`for input ${value}`, () => {
        it("it should throw", () => {
          expect(() => checkIsDefined(value)).toThrowError(
            PreconditionFailedError
          );
        });
      });
    });
  });
});
