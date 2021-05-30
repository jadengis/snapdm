import { DocumentData } from './adapter/references';
import { Model, ModelClass } from './model';

export type ModelFactory<T extends Model> =
  | ModelClass<T>
  | Readonly<{
      type: ModelClass<T>;
      factory: (data: DocumentData) => T;
    }>;

export function buildModel<T extends Model>(
  factory: ModelFactory<T>,
  data: DocumentData
): T {
  return isModelClass(factory) ? new factory(data) : factory.factory(data);
}

function isModelClass<T extends Model>(
  factory: ModelFactory<T>
): factory is ModelClass<T> {
  return typeof factory === 'function';
}
