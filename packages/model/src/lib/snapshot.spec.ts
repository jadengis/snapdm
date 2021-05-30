import { isSnapshot } from './snapshot';
import { adapter } from './adapter';

describe('Snapshot', () => {
  describe('isSnapshot', () => {
    let value: unknown;
    const subject = () => isSnapshot(value);

    [
      [{}, false],
      [{ type: 'foo', id: 'foo-adfgadfg' }, false],
      [
        {
          type: 'foo',
          id: 'foo-adfadfg',
          ref: adapter().references('foos', 'foo-adfgadfg'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        true,
      ],
      [
        {
          type: 'foo',
          id: 'foo-adfadfg',
          ref: adapter().references('foos', 'foo-adfgadfg'),
          createdAt: new Date(),
          updatedAt: new Date(),
          value: 'adfgadfga',
          valueSize: 5,
        },
        true,
      ],
    ].forEach(([input, output]) => {
      describe(`for input ${JSON.stringify(input)}`, () => {
        beforeEach(() => {
          value = input;
        });

        it(`should return ${output}`, () => {
          expect(subject()).toEqual(output);
        });
      });
    });
  });
});
