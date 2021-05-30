import { assertIsDefined } from '@snapdm/preconditions';
import { FieldValueFactory } from './field-values';
import { IdFactory } from './ids';
import { ReferenceFactory } from './references';
import { TimestampFactory } from './timestamps';

export type Adapter = Readonly<{
  /**
   * The IdGenerator to use when
   */
  ids: IdFactory;
  fieldValues: FieldValueFactory;
  timestamps: TimestampFactory;
  references: ReferenceFactory;
}>;

let __adapter: Adapter | undefined;

export function adapter(): Adapter {
  assertIsDefined(
    __adapter,
    "Adapter not set. Call 'initialize' before creating models."
  );
  return __adapter;
}

export function setAdapter(adapter: Adapter): void {
  __adapter = adapter;
}
