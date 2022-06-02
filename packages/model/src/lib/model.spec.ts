import { Model, ModelRef } from './model';
import { Snapshot } from './snapshot';
import { cloneModel } from './clone-model';

type FooData = Readonly<{
  value: string;
  valueSize: number;
}>;

type FooInitializer = Readonly<{
  value: string;
}>;

interface Foo extends FooData { }

class Foo extends Model<FooData, FooInitializer>({
  type: 'Foo',
  collection: 'foos',
  initialize: (init) => ({ ...init, valueSize: init.value.length }),
}) {
  updateValue(value: string): Foo {
    return cloneModel<Foo>(this, { value, valueSize: value.length });
  }
}

type BarData = Readonly<{
  data: number;
  foo: ModelRef<Foo>;
}>;

type BarInitializer = Readonly<{
  data: number;
  foo: Foo;
}>;

interface Bar extends BarData { }

class Bar extends Model<BarData, BarInitializer>({
  type: 'Bar',
  collection: 'bars',
  parent: {
    model: Foo,
    attribute: 'foo',
  },
  initialize: ({ data, foo }) => ({ data, foo: foo.toRef() }),
}) { }

type BazData = BarData &
  Readonly<{
    name: string;
  }>;

type BazInitializer = BarInitializer &
  Readonly<{
    name: string;
  }>;

interface Baz extends BazData { }

class Baz extends Model<Bar, BazData, BazInitializer>({
  extends: Bar,
  options: {
    type: 'Baz',
    initialize: ({ name }, base) => {
      return { ...base(), name };
    },
  },
}) {
  action(name: string) {
    // this.snapshot.name
    // return cloneModel<Baz>(this, { name });
  }
}

describe('Model', () => {
  describe('static methods', () => {
    const subject = () => Foo;

    it('should have a type', () => {
      expect(subject().type).toEqual('Foo');
    });

    it('should have a collection', () => {
      expect(subject().collection).toEqual('foos');
    });
  });

  describe('with new model', () => {
    let init: FooInitializer | Snapshot<FooData>;
    const subject = () => new Foo(init);

    beforeEach(() => {
      init = { value: 'Bars' };
    });

    it('should delegate data props', () => {
      const result = subject();
      expect(result.value).toEqual(init.value);
      expect(result.valueSize).toEqual(init.value.length);
    });

    it('should have the configured type', () => {
      expect(subject().type).toEqual(Foo.type);
    });

    it('should be new', () => {
      expect(subject().isNew).toEqual(true);
    });

    it('should not have updates', () => {
      expect(subject().updates).toBeUndefined();
    });

    describe('.toRef', () => {
      it('should build correct ref', () => {
        expect(subject().toRef()).toMatchObject({
          type: 'Foo',
          id: expect.any(String),
          ref: expect.objectContaining({
            id: expect.any(String),
            path: expect.stringMatching(/foos\/.*/),
          }),
        });
      });

      it('should allow attribute selection ref', () => {
        expect(subject().toRef('value')).toMatchObject({
          type: 'Foo',
          id: expect.any(String),
          ref: expect.objectContaining({
            id: expect.any(String),
            path: expect.stringMatching(/foos\/.*/),
          }),
          value: 'Bars',
        });
      });
    });

    describe('.__copy', () => {
      it('should merge the input into the underlying snapshot and update updates', () => {
        const input = 'Bazlonia';
        const result = subject().updateValue(input);
        expect(result.value).toEqual(input);
        expect(result.valueSize).toEqual(input.length);
        expect(result.updates).toMatchObject({
          updatedAt: expect.anything(),
          value: input,
          valueSize: input.length,
        });
      });
    });
  });

  describe('model with parent', () => {
    const foo = new Foo({ value: 'Bars' });
    let init: BarInitializer;
    const subject = () => new Bar(init);

    beforeEach(() => {
      init = { data: 45, foo };
    });

    it('should be constructable', () => {
      expect(subject().data).toEqual(init.data);
    });

    it('should have a nested ref', () => {
      expect(subject().ref.path).toMatch(/foos\/.*\/bars\/.*/);
    });
  });

  describe('model extension', () => {
    const foo = new Foo({ value: 'Bars' });
    let init: BazInitializer;
    const subject = () => new Baz(init);

    describe('model metadata', () => {
      it('should inherit collection', () => {
        expect(Baz.collection).toEqual(Bar.collection);
      });

      it('should overwrite type', () => {
        expect(Baz.type).toEqual('Baz');
      });

      it('should inherit parent', () => {
        expect(Baz.parent).toEqual(Bar.parent);
      });
    });

    describe('model properties', () => {
      beforeEach(() => {
        init = {
          data: 25,
          name: 'big model',
          foo,
        };
      });

      it('should have all expected properties', () => {
        const baz = subject();
        expect(baz.name).toEqual(init.name);
        expect(baz.data).toEqual(init.data);
        expect(baz.foo.id).toEqual(foo.id);
      });
    });
  });
});
