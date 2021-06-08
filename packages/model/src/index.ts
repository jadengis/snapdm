import ModelMixin from './lib/model';

export { initialize, SnapdmOptions } from './lib/initialize';
export { Adapter } from './lib/adapter';
export {
  AnyModel,
  ModelRef,
  ModelClass,
  ModelOptions,
  InitializeFunction,
} from './lib/model';
export { ModelFactory, buildModel } from './lib/model-factory';
export const Model = ModelMixin;
