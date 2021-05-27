import {
  FieldValueFactory,
  FieldValue,
  setFieldValue,
} from './lib/field-value';
import { setIdGenerator } from './lib/ids';

function* idGenerator(): Generator<string> {
  yield Math.random().toString();
}

// Configure the base model id generator with this simple id generator.
const generator = idGenerator();

function mockFieldValueFactory(): FieldValueFactory {
  return {
    serverTimestamp(): FieldValue {
      return {
        tag: 'new-server-timestamp',
        isEqual(_: FieldValue): boolean {
          return true;
        },
      } as FieldValue;
    },
    arrayUnion(...values: any[]): FieldValue {
      return {
        tag: 'new-array-union',
        values: values,
        isEqual(_: FieldValue): boolean {
          return true;
        },
      } as FieldValue;
    },
    arrayRemove(...values: any[]): FieldValue {
      return {
        tag: 'new-array-remove',
        values,
        isEqual(_: FieldValue): boolean {
          return true;
        },
      } as FieldValue;
    },
    increment(value: number): FieldValue {
      return {
        tag: 'new-increment',
        value,
        isEqual(_: FieldValue): boolean {
          return true;
        },
      } as FieldValue;
    },
  } as FieldValueFactory;
}

setIdGenerator(() => generator.next().value);
setFieldValue(mockFieldValueFactory());
