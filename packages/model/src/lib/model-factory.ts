import { DocumentData } from './adapter/references';
import { AnyModel, AnyModelClass, ModelClass } from './model';

export type ModelFactory<T extends AnyModel> =
  | ModelClass<T>
  | Readonly<{
      type: AnyModelClass<T>;
      factory: (data: DocumentData) => T;
    }>;

export function buildModel<T extends AnyModel>(
  factory: ModelFactory<T>,
  data: DocumentData
): T {
  return isModelClass(factory) ? new factory(data) : factory.factory(data);
}

function isModelClass<T extends AnyModel>(
  factory: ModelFactory<T>
): factory is ModelClass<T> {
  return typeof factory === 'function';
}
