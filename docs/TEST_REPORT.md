# Test Report — Stabilization v1.0

## Collection Platform 4.1.0 stabilization

- `npm.cmd run check`: passed.
- Static validation: 43 JavaScript files plus manifest and extension pages.
- Node regression suite: 20/20 passed.
- Added coverage for archival-only JSON UI, structured failure codes, persistent job bounds, background checkpoint transport, and Discord-native evidence retention.
- `git diff --check`: passed.
- Live authenticated Discord pagination and recovery remain required acceptance gates before production promotion.

## Earlier tests

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
