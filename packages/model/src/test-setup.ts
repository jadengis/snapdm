import { setAdapter } from './lib/adapter';
import { DocumentReference, ReferenceFactory } from './lib/adapter/references';
import { Timestamp, TimestampFactory } from './lib/adapter/timestamps';
import { FieldValueFactory, FieldValue } from './lib/adapter/field-values';

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

function mockTimestampFactory(): TimestampFactory {
  function fromDate(date: Date): Timestamp {
    return {
      isEqual(other: Timestamp): boolean {
        return other.toDate() === date;
      },
      seconds: date.getSeconds(),
      nanoseconds: 0,
      toDate(): Date {
        return date;
      },
      toMillis(): number {
        return date.getMilliseconds();
      },
    };
  }
  return {
    now(): Timestamp {
      return fromDate(new Date());
    },
    fromDate,
    fromMillis(ms: number): Timestamp {
      return fromDate(new Date(ms));
    },
  };
}

function mockReferenceFactory(): ReferenceFactory {
  return (collection: string, id: string, parent?: DocumentReference) => {
    let path = `${collection}/${id}`;
    if (parent) {
      path = `${parent.path}/${path}`;
    }
    return {
      id: id,
      path: path,
      parent,
    };
  };
}

setAdapter({
  ids: () => generator.next().value,
  fieldValues: mockFieldValueFactory(),
  timestamps: mockTimestampFactory(),
  references: mockReferenceFactory(),
});
