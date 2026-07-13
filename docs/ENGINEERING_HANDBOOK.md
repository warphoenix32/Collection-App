# Engineering Handbook

## Doctrine

Requirements precede implementation. Discovery precedes architecture. Architecture precedes code. Evidence precedes assumptions. Internals are canonical; interfaces are platform-native. Prefer Buy → Integrate → Build. Preserve the Known, Build the New.

## Repository policy

`main` is production-only and contains the recoverable Discord v3.6.0 LTS baseline. `development` contains Platform v4 evolution. Stable production milestones receive immutable annotated tags. Features branch from and return to `development` after validation.

## Change rules

- Do not rewrite stable collectors for elegance.
- Core modules cannot query source-native DOM or call source APIs.
- Adapters own detection, parsing, navigation, discovery, and native terminology.
- Runtime policies are mission inputs; adapter constants may exist only as compatibility defaults.
- Every acquisition declares intent and produces provenance.
- Conversation Schema changes require an independent schema mission.
- New adapters must pass manifest, detection, capability, isolation, and regression gates.

## Adapter #2 readiness review

An adapter supplies manifest/register modules, source-native implementation, detection confidence, canonical runtime methods, normalized discovery, and UI labels. It does not modify acquisition, batch, exporter, profiles, platform detection, registry, popup operation logic, or Knowledge Object contracts.
