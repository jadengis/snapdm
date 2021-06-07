import { Model } from './model';
import { buildModel } from './model-factory';

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

describe('ModelFactory', () => {
  describe('buildModel', () => {
    const model = new Foo({ value: 'value' });

    describe('with ModelClass factory', () => {
      const subject = () => buildModel(Foo, model.snapshot);

      it('should build a model', () => {
        expect(subject().snapshot).toMatchObject({
          type: model.type,
          id: model.id,
          ref: model.ref,
          value: model.value,
        });
      });
    });

    describe('with factory config', () => {
      const subject = () =>
        buildModel(
          { type: Foo, factory: (data) => new Foo(data as Foo['snapshot']) },
          model.snapshot
        );

      it('should build a model', () => {
        expect(subject().snapshot).toMatchObject({
          type: model.type,
          id: model.id,
          ref: model.ref,
          value: model.value,
        });
      });
    });
  });
});
