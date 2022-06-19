import { Model, ModelRef } from './model';
import { Snapshot } from './snapshot';

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
    return this.clone({ value, valueSize: value.length });
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
  validators: [
    (snapshot) => {
      if (snapshot.data > 10) {
        return { data: `data is too big!` };
      }
      return null;
    },
  ],
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

class Baz extends Model<BazData, BazInitializer>({
  extends: Bar,
  type: 'Baz',
  initialize: ({ name, data, foo }) => {
    return { name, data, foo: foo.toRef() };
  },
}) {
  action(name: string) {
    return this.clone({ name });
  }
}

type WithArrayData = Readonly<{
  array: string[];
}>;

interface WithArray extends WithArrayData { }

class WithArray extends Model<WithArrayData, WithArrayData>({
  type: 'WithArray',
  collection: 'withArray',
}) { }

type File = Readonly<{
  type: string;
  name: string;
}>;

type FolderData = Readonly<{
  files: File[];
}>;

interface Folder extends FolderData { }

class Folder extends Model<FolderData, FolderData>({
  type: 'Folder',
  collection: 'folders',
}) { }

describe('Model', () => {
  describe('static methods', () => {
    const subject = () => Foo;

    it('should have a type', () => {
      expect(subject().type).toEqual('Foo');
    });

    it('should have a collection', () => {
      expect(subject().collection).toEqual('foos');
    });

    it('should have default validator if none set', () => {
      expect(Foo.validator(new Foo({ value: 'Mario' }).snapshot)).toBeNull();
    });

    it('should have a custom validator when set', () => {
      expect(
        Bar.validator(
          new Bar({ data: 25, foo: new Foo({ value: 'Mario' }) }).snapshot
        )
      ).toStrictEqual({ data: 'data is too big!' });
    });

    it('should have a custom validator when inherited', () => {
      expect(
        Baz.validator(
          new Baz({ name: 'Baz', data: 25, foo: new Foo({ value: 'Mario' }) })
            .snapshot
        )
      ).toStrictEqual({ data: 'data is too big!' });
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

    describe('.clone', () => {
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

    beforeEach(() => {
      init = {
        data: 25,
        name: 'big model',
        foo,
      };
    });

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

      it('should be an instanceof', () => {
        expect(subject() instanceof Bar).toBeTruthy();
      });
    });

    describe('model properties', () => {
      it('should have all expected properties', () => {
        const baz = subject();
        expect(baz.name).toEqual(init.name);
        expect(baz.data).toEqual(init.data);
        expect(baz.foo.id).toEqual(foo.id);
      });
    });
  });

  describe('with arrays', () => {
    describe('simple array', () => {
      const withArray = new WithArray({ array: ['foo'] });

      [[], ['bar']].forEach((test) => {
        it('should replace the array', () => {
          const result = withArray.clone({ array: test });
          expect(result.array).toEqual(test);
        });
      });
    });

    describe('complex array', () => {
      const folder = new Folder({ files: [{ type: 'File', name: 'wowza' }] });

      [[], [{ type: 'File', name: 'blue blue' }]].forEach((test) => {
        it('should replace the array', () => {
          const result = folder.clone({ files: test });
          expect(result.files).toEqual(test);
        });
      });
    });
  });
});
