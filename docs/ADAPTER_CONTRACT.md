# Platform Adapter Contract v2.0.0

A platform adapter must expose the capabilities required to translate a platform-specific conversation surface into the Collection Platform pipeline.

Required canonical functions:

- `navigation.describe()`
- `navigation.navigate()`
- `collector.parse()`
- `collector.loadHistorical()`

Every registration supplies `manifest`, `detect(context)`, and `createRuntime(context)`. The manifest declares identity, independent version, platform compatibility, capabilities, sources, entities, exports, runtime policies, UI definition, topology/historical support, provenance method, storage keys, and lifecycle.

Normalized discovery handlers are optional:

- `discovery.capability()`
- `discovery.source()`
- `discovery.entity()`
- `discovery.relationship()`
- `discovery.topology()`

Legacy source-native functions may remain inside the adapter but are not exposed to reusable core modules.
