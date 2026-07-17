# Phase III Regression Validation

## Automated gate

- Manifest JSON and every declared script validate.
- Registry manifest and duplicate-ID enforcement.
- Highest-confidence adapter selection.
- Platform acquisition through a canonical adapter without a Discord global.
- Legacy profile to executable mission migration.
- Runtime policy and collection intent normalization.
- Knowledge Object required-field validation.
- Discord historical checkpoint recovery.
- 30,000-element virtualized-message deduplication stress.
- Failed-export restoration and overlapping-operation exclusion.
- Topology acquisition isolation, categories, forums, threads, unreadable metadata, and non-invention.

## Static architecture gate

Reusable `src/core` and `src/platform` contain no Discord references. Chrome access in new platform code is isolated to the browser-extension host. Discord DOM selectors remain under `src/adapters/discord`.

## Live gate

Automated tests cannot substitute for authenticated Discord long-run validation. Execute the existing `FINAL_VALIDATION.md` matrix before promoting `development` to a production Platform v4 milestone.
