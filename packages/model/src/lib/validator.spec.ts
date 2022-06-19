import { combine } from './validator';

describe('combine', () => {
  describe('with two simple validators', () => {
    const v1 = (x: string) => {
      if (x.includes('bat')) {
        return { bat: 'included bat' };
      }
      return null;
    };
    const v2 = (x: string) => {
      if (x.includes('cat')) {
        return { cat: 'included cat' };
      }
      return null;
    };

    const v = combine([v1, v2]);

    it('should return null for no violation', () => {
      expect(v('dog')).toBeNull();
    });

    it('should return first validation in case of violation', () => {
      expect(v('a big bat')).toStrictEqual({ bat: 'included bat' });
    });

    it('should return second validation in case of violation', () => {
      expect(v('a big cat')).toStrictEqual({ cat: 'included cat' });
    });

    it('should return both validations in case of violation', () => {
      expect(v('a bat cat')).toStrictEqual({ bat: 'included bat', cat: 'included cat' });
    });
  });
});
