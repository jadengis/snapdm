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
