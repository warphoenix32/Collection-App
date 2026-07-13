# Change Summary — Stabilization v1.0

## Files and architecture

- `manifest.json`, `src/core/config.js`: 3.5.2 release and archival storage settings.
- `content.js`: operation serialization and reliable restoration.
- `src/core/cache.js`: checkpoint persistence API.
- `src/core/diagnostics/logger.js`: persistent bounded diagnostics.
- `src/adapters/discord/collector.js`: buffer recovery and safe bounds.
- `src/adapters/discord/navigation.js`: correct initial navigation.
- `src/core/conversation-model.js`: safe actual-range calculation.
- `package.json`, `tests/*`: dependency-free automated checks.
- `README.md`, `CHANGELOG.md`, `docs/*`: release and engineering documentation.

No major redesign was performed.

## Behavior and compatibility

Only one operation runs in a tab at once. Matching interrupted historical jobs resume automatically. Diagnostics survive restart, and failed exports attempt restoration. Existing popup workflow, schemas, filenames, profiles, navigation cache, formats, and strategies remain compatible. Version 1 checkpoint metadata is safely ignored. `unlimitedStorage` is the only new permission.

## Final recommendation

**ADDITIONAL ENGINEERING REQUIRED**

Automated recovery and stress results improve confidence, but production readiness cannot be asserted until authenticated live acceptance and a multi-hour browser soak pass. Batch-level resume and chunked checkpoints are recommended before unattended, very large operations.
