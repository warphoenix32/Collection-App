# Test Report — Stabilization v1.0

## Tests added

- Manifest parsing, declared-file existence, and syntax validation for 22 JavaScript entry files.
- Acquisition checkpoint write/read/clear regression test.
- Failed-export restoration test.
- Concurrent-operation rejection test.
- 30,000-element stress test validating deterministic 15,000-message deduplication and ordering.
- Interrupted-acquisition test validating persisted and rendered message merging.

## Execution

```text
node tests/static-check.js
node --test tests/*.test.js
git diff --check
```

Environment: Node.js 24.18.0 on Windows. The suite has no third-party dependencies.

## Scope limits

The suite exercises storage, orchestration, recovery, deduplication, large-array behavior, and release integrity. It does not claim live Discord selector compatibility, authenticated navigation, browser heap stability, download UX, or a multi-hour soak. Those require an operator-controlled session.

## Regressions prevented

The gate covers missing scripts, invalid syntax, non-restoring failed exports, overlapping shared-buffer jobs, non-functional checkpoint recovery, duplicate virtualized messages, and large-array stack overflow.
