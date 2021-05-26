import { assertIsDefined as ids } from '@snapdm/preconditions';

export type IdGenerator = () => string;

let _idGenerator: IdGenerator | undefined;

export function generateId(): string {
  ids(_idGenerator, 'IdGenerator must be defined.');
  return _idGenerator();
}

export function setIdGenerator(gen: IdGenerator): void {
  _idGenerator = gen;
}
