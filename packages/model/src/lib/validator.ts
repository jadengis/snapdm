/**
 * An object containing error keys and reasons.
 */
export type ValidationErrors = Record<string, any>

/**
 * A validator is a function that takes a value and return null if that value
 * is valid, or an object containing error keys and reasons.
 */
export type Validator<T> = (value: T) => ValidationErrors | null

/**
 * Combine the list of validators into a single validator.
 * @param validators List of validators to combine.
 * @returns A single validator applying all the passed in validation.
 */
export function combine<T>(validators: Validator<T>[]): Validator<T> {
  return value => validators.reduce((res, next) => {
    const errors = next(value)
    if(errors) {
      return res ? {...res, ...errors} : errors;
    }
    return res
  }, null as ValidationErrors | null)
}
