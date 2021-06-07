import { Model, ModelRef } from './model';
import { Snapshot } from './snapshot';

type FooData = Readonly<{
  value: string;
  valueSize: number;
}>;

type FooInitializer = Readonly<{
  value: string;
}>;

interface Foo extends FooData {}

class Foo extends Model<FooData, FooInitializer>({
  type: 'Foo',
  collection: 'foos',
  prefix: 'foo',
  initialize: (init) => {
    return { ...init, valueSize: init.value.length };
  },
}) {}

type BarData = Readonly<{
  data: number;
  foo: ModelRef<Foo>;
}>;

type BarInitializer = Readonly<{
  data: number;
  foo: Foo;
}>;

interface Bar extends BarData {}

class Bar extends Model<BarData, BarInitializer>({
  type: 'Bar',
  collection: 'bars',
  prefix: 'bar',
  parent: {
    model: Foo,
    attribute: 'foo',
  },
  initialize: ({ data, foo }) => {
    return { data, foo: foo.toRef() };
  },
}) {}

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

    it('should prefix generated id', () => {
      expect(subject().id).toMatch(/foo-.*/);
    });

    it('should have the configured type', () => {
      expect(subject().type).toEqual(Foo.type);
    });

    it('should be new', () => {
      expect(subject().isNew).toEqual(true);
    });

    it('should build correct ref', () => {
      expect(subject().toRef()).toMatchObject({
        type: 'Foo',
        id: expect.stringMatching(/foo-.*/),
        ref: expect.objectContaining({
          id: expect.stringMatching(/foo-.*/),
          path: expect.stringMatching(/foos\/foo-.*/),
        }),
      });
    });
  });

  describe('model with parent', () => {
    const foo = new Foo({ value: 'Bars' });
    let init: BarInitializer | Snapshot<BarData>;
    const subject = () => new Bar(init);

    beforeEach(() => {
      init = { data: 45, foo };
    });

    it('should be constructable', () => {
      expect(subject().data).toEqual(init.data);
    });

    it('should have a nested ref', () => {
      expect(subject().ref.path).toMatch(/foos\/foo-.*\/bars\/bar-.*/);
    });
  });
});
