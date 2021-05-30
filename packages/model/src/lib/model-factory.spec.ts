import { Model, ModelInit } from './model';
import { buildModel } from './model-factory';

type FooData = Readonly<{
  value: string;
  valueSize: number;
}>;

type FooInitializer = Readonly<{
  value: string;
}>;

interface Foo extends FooData {}

class Foo extends Model<FooData, FooInitializer> {
  static readonly type = 'Foo';
  static readonly collection = 'foos';
  static readonly prefix = 'foo';
  static initializer(init: FooInitializer): ModelInit<Foo['snapshot']> {
    return { ...init, valueSize: init.value.length };
  }
}

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
