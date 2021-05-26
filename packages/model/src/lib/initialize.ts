import { IdGenerator, setIdGenerator } from './ids';
import { TimestampFactory, setTimestamp } from './timestamp';
import { FieldValueFactory, setFieldValue } from './field-value';

export interface SnapdmOptions {
  readonly idGenerator: IdGenerator;
  readonly timestamp: TimestampFactory;
  readonly fieldValue: FieldValueFactory;
}

export function initialize(options: SnapdmOptions): void {
  setIdGenerator(options.idGenerator);
  setTimestamp(options.timestamp);
  setFieldValue(options.fieldValue);
}
