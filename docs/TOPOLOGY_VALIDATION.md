# Server Topology Discovery Validation Report

## Automated validation

- Manifest and all 27 declared JavaScript files parse successfully.
- Existing collection recovery, concurrency, and stress regressions pass.
- Categories and collapsed state are preserved from exposed metadata.
- Text channels and forums are represented as collectible when navigable.
- Threads retain exposed parent, archived, and locked metadata.
- Metadata without a navigable link is classified `known-unreadable` and cannot be collected.
- Records without exposed channel IDs are discarded rather than invented.
- The topology message route does not invoke acquisition.
- JSON and Markdown topology renderers produce independent output.

## Architectural validation

- Discord selectors and DOM interpretation remain in the Discord adapter.
- The reusable topology model and renderers contain no Discord DOM queries.
- Conversation Schema 2.0.0 is unchanged.
- Historical acquisition source is unchanged.
- No permissions, authentication paths, background tabs, API automation, or request interception were added.

## Live validation status

Automated validation cannot prove compatibility with the current authenticated Discord DOM. The live acceptance matrix in `FINAL_VALIDATION.md` must be executed against representative servers containing collapsed categories, forums, threads, muted channels, and exposed unreadable metadata.
