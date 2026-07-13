# Stability Report — 3.5.2 LTS

## Defects corrected

- Original-view restoration now runs after unsuccessful export results.
- Simultaneous collection and batch jobs are rejected with a busy response.
- Initial Discord navigation uses a matching rendered anchor when available.
- Large timestamp sets no longer risk a maximum-call-stack exception.

## Reliability and recovery

- Incomplete checkpoints persist accumulated messages, URL, cutoff, counters, runtime, and recovery state.
- A matching collection restores the buffer after browser, tab, or extension interruption.
- Structured logs are bounded and persisted.
- `unlimitedStorage` supports long-running archival state.

## Performance

- Range calculation is linear and stack-safe.
- Collection remains serial and deterministic, preventing duplicate concurrent traversal.

## Remaining limitations

- Completed checkpoints are retained for diagnostics and not reused.
- Checkpoint writes serialize the full buffer; future large jobs should use incremental chunks.
- Batch target cursors do not resume automatically.
- Authenticated multi-hour soak and browser heap validation remain outstanding.
