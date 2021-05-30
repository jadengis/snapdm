export interface Timestamp {
  /**
   * The number of seconds of UTC time since Unix epoch 1970-01-01T00:00:00Z.
   */
  readonly seconds: number;

  /**
   * The non-negative fractions of a second at nanosecond resolution.
   */
  readonly nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
  isEqual(other: Timestamp): boolean;
}

export interface TimestampFactory {
  /**
   * Creates a new timestamp with the current date, with millisecond precision.
   *
   * @return A new `Timestamp` representing the current date.
   */
  now(): Timestamp;

  /**
   * Creates a new timestamp from the given date.
   *
   * @param date The date to initialize the `Timestamp` from.
   * @return A new `Timestamp` representing the same point in time as the
   * given date.
   */
  fromDate(date: Date): Timestamp;

  /**
   * Creates a new timestamp from the given number of milliseconds.
   *
   * @param milliseconds Number of milliseconds since Unix epoch
   * 1970-01-01T00:00:00Z.
   * @return A new `Timestamp` representing the same point in time as the
   * given number of milliseconds.
   */
  fromMillis(milliseconds: number): Timestamp;
}
