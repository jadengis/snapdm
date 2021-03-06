# 0.11.0

### Features

- Allow the settings of optional `validators` on a model class. This makes it so backend implementations can apply validations before writing to the database.

# 0.10.3

### Fixes

- Fixes `clone` in the case where an empty array is being merged with a non-empty array. Before the
  arrays were merged. Now the empty array replacing the existing array.

# 0.10.2

### Fixes

- change `index.cjs.js` to `index.cjs` to fix the `module` issue.

# 0.10.1

### Fixes

- Some more ergonomic types around `ModelParent`.

# 0.10.0

### BREAKING CHANGES

- Package format has changed to include both an ESM bundle and a CJS bundle.
- Packages are now set to `"type": "module"`.

# 0.9.0

### BREAKING CHANGES

- Initializer functions for extension models now behave differently. They do not recieve the
  extended models initialization data as an argument.
- `__copy` renamed to `clone`

### Features

- `toRef` now allows the inclusion of a list of additional properties to make nesting objects
  easier.

### Fixes

- Fixes the typing of `__copy` and `snapshot` by rewriting how the inheritance hierarchy works for
  extension models

# 0.8.0

### BREAKING CHANGES

- Changes the Model extension API to accept an `ExtendedModelOptions` object instead of 2
  parameters.

### Fixes

- Fix a type issue with Model extension.

# 0.7.1

- `ModelClass` supports abstract types.

# 0.7.0

### BREAKING CHANGES

- The second argument of an `InitializeFunctionWithBase` is a lazy function so that sub models that don't need the base's initialization logic don't need to pay the cost for it.

# 0.6.4

### Fixes

- I guess don't expose private members :grimace:

# 0.6.3

### Fixes

- Fix constructor signatures for models.

# 0.6.2

### Fixes

- Introduce `AbstractType` and `AnyType` to support abstract base models.

# 0.6.1

### Fixes

- I guess don't expose private members :grimace:

# 0.6.0

### Features

- Adds support for extending existing models with a new signature for the model mixin function. The `Model(base, modelWithBaseOptions)` call signature ensures the extending model extends the given `base` model. Model extensions are constrained to live in the same collection as their base so model metadata props `collection` and `parent` are not overwriteable. `type` can be overwritten. Models with a base have a different signature for an initializer which include the ModelInit data of the base model. This allows the base model init data to be merged with the new data to form the final model init data for the new model.

# 0.5.5

### Fixes

- Use public readonly fields on the model instead of getters and private fields, to remove unproxied access to model methods. This solves an issue where TS thinks that `this.value` exists in model methods when `this.snapshot.value` exists.

# 0.5.4

#### BREAKING CHANGES

- Remove prefix because its stupid and unnecessary given that every document has a document reference attached to it that specifies the path and hence prepends the collection name.

### Fixes

- Goofy private variable access bug fixed by pushing optional updates and `isNew` when creating a snapshot.

# 0.5.3

### Fixes

- Make the `AnyModel` shim interface mor complete.

# 0.5.2

### Fixes

- Mixins strip accessibility modifiers away, so use a shim `AnyModel` interface to circumvent stupid ES private property declarations.

# 0.5.1

### Fixes

- Fixes an issue where ES private property emit made it impossible for Models to be used in contraints requiring `AnyModel`.

# 0.5.0

### Features

#### BREAKING CHANGES

- Completely rework the implementation of configuring a model. Model now behaves like a mixin class so that you can pass in configuration metadata such as `type` and `collection` in the extension declaration. This has the benefit of making class declaration type-safe (it's not possible to forget to declare initialize). Not only is the breaking in a big way, but now instead of using `T extends Model` to talk as a type constraint for any model, you need to use `T extends AnyModel`.
- Completely reimagine parent model declarations. Now a model parent is a simple class and field specification. When computing refs relative to a parent, the parent model ref is looked up on the class at the specified field. The `model` field of the `ModelParent` can be used to recursively determine the nesting of a model, making it possible to build generic lookups regardless of model depth.
- Fields that use to be TS private on `__Model` are now ES private. `__copy` was made unprotected to support the mixin style declaration.

# 0.4.4

### Fixes

- rollback `type: module` change as it really messes up everything

# 0.4.3

### Fixes

- fix implementation of `InitFunction`

# 0.4.2

### Fixes

- fix implementation of `Type`

# 0.4.1

### Features

- Expose `ModelClass`

### Fixes

- Make the default type of `Model` easier to work with

# 0.4.0

### Fixes

- BREAKING: Correctly mark in `package.json` that libraries are distributed as ES modules

# 0.3.1

### Features

- Expose `Model` with default type arguments for easier type constraints

### Internal

- Removes `AnyModel`

# 0.3.0

### Features

- Rework snapshots to include DocumentReferences
- Create adapter concept to simplify library configuration
- Add ModelFactory concept to facilitate repository configuration

# 0.2.0

### Features

- Make implementing models easier by proxying properties to the internal `__value`

# 0.1.0

### Features

- Initial release
