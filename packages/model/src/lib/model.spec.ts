import { Model, ModelInit } from './model';
import { Snapshot } from './snapshot';

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

describe('Model', () => {
  let init: FooInitializer | Snapshot<FooData>;
  const subject = () => new Foo(init);

  describe('with new model', () => {
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
      });
    });
  });
});
