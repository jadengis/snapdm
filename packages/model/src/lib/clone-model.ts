import { DeepPartial } from 'ts-essentials';
import { adapter } from './adapter';
import { AnyModel, ModelAttributes } from './model';
import { merge } from './utils/merge';

/**
   * Creates a new instance of m's Model containing the provided
   * updates to the internal snapshot. This method is not intended to be
   * consumed externally to the class and exists primarily to be used as
   * an implementation detail of more domain oriented transformations.
   * @param m The model to clone.
   * @param updates A patch to apply to the current snapshot in creating
   * the new one.
   * @returns A new model with the given patch applied.
   */
export function cloneModel<T extends AnyModel<object>>(
  m: T,
  updates?: DeepPartial<ModelAttributes<T["snapshot"]>>
): T {
  // If there we no updates, simply copy the entity.
    if (updates === undefined || updates === {}) {
      return new (m as any).model({ ...m.snapshot });
    }
    // In the presence of updates, update the the updatedAt timestamp,
    // and set the correct `updates` on the new entity.
    const computedUpdates = merge(m.updates, updates, {
      updatedAt: adapter().fieldValues.serverTimestamp(),
    });
    const newValue = merge(m.snapshot, computedUpdates);
    const newEntity = new (m as any).model(newValue, {
      updates: computedUpdates,
      isNew: m.isNew,
    });
    return newEntity;
}
