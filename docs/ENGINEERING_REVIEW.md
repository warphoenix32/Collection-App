# Engineering Review — Stabilization v1.0

## Active application and architecture

The root project is the active Collection App because `manifest.json` declares the root popup, the complete ordered content-script graph, Discord host permissions, and no competing entry point. It is a Chrome Manifest V3 extension. `popup.html`/`popup.js` are the operator entry point; `content.js` is the runtime message dispatcher in the authenticated Discord tab.

There is no bundler or production package dependency. Modules are browser IIFEs loaded in manifest order into `globalThis.DCE`. Chrome storage is the persistence mechanism. The application uses `chrome.tabs`, runtime messaging, `chrome.storage.local`, MutationObserver, History, DOM traversal, synthetic input events, Blob/object URLs, and anchor downloads.

The workflow is popup request → acquisition/navigation → virtualized DOM accumulation → parsing and identity normalization → conversation model → JSON/Markdown rendering → browser download. Batch collection repeats that sequence serially and emits a manifest.

## Strengths

- Platform-neutral schema and adapter contract separate source parsing from normalized output.
- Discord selectors are confined to the adapter.
- Virtualized windows are accumulated and deterministically deduplicated.
- Historical coverage is explicit rather than overstated.
- Batch execution restores the original location and continues after individual failures.
- The runtime has no supply-chain dependencies.

## Corrected weaknesses

- Checkpoints stored counters but no messages. Version 2 checkpoints persist and resume the buffer.
- Failed exports returned before restoration. Restoration now runs for success and failure results.
- Concurrent requests could corrupt one shared buffer. A runtime exclusivity guard rejects overlap.
- Diagnostics were memory-only. A bounded 1,000-entry structured log survives restarts.
- The first navigation attempt had a zero/one-based error and skipped the discovered anchor.
- Timestamp bounds used argument spreading and could overflow on large archives.
- No executable test framework existed. Node's built-in runner now provides a dependency-free gate.

## Remaining risks

- Discord's undocumented DOM and routing are the dominant external risk.
- Checkpoints are one storage object. Very large archives would benefit from chunked IndexedDB records and checksums.
- Batch target progress is not resumable; the active channel buffer resumes, but the plan must be restarted.
- ETA is omitted because virtualized-history throughput is too variable for a trustworthy estimate.
- Authenticated acceptance, multi-hour soak, and browser memory profiling require an operator-controlled Discord session unavailable here.

## Future collectors

The adapter contract, normalized model, renderers, exporter, logger, and batch orchestrator are reusable for Discord-adjacent and document/web sources. A new source needs discovery, navigation, parser, and collector modules. Before multiple adapters, remaining direct `DCE.discord` references in core orchestration should be injected through the selected adapter. This is a contained evolution, not a rewrite.

## Recommendations

1. Run `FINAL_VALIDATION.md` against representative long channels.
2. Add chunked IndexedDB checkpoints before collections routinely exceed extension-local memory.
3. Persist a batch cursor and completed-target manifest.
4. Add extension-browser tests using privacy-safe Discord DOM fixtures.
