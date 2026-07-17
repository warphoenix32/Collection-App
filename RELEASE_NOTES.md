# Release Notes — Collection Platform v4.0.1

## Stability and Operator Control

Version 4.0.1 is a backward-compatible maintenance release. Long historical collections and batches can now be stopped by the operator without discarding already acquired messages. The collector finishes its current loading step, emits a partial export with explicit coverage, stops unstarted batch targets, and restores the original view.

Adapter detection now requires a configurable minimum confidence. Runtime policies are clamped consistently across execution and provenance, and saved mission profiles preserve their declared intent and runtime policy when run.

The development package again includes `package.json` and the automated validation suite referenced by the documentation.

### Validation

- 39 manifest-loaded production scripts pass syntax and existence validation.
- Reusable core/platform modules pass the no-Discord-coupling gate.
- Nine automated tests pass for detection, registry behavior, runtime policy, mission execution, cancellation, restoration, intent, Knowledge Objects, and UI translation.

---

# Previous Release Notes — Collection Platform v4.0.0

## Architecture Evolution

Discord Reference Adapter v3.6.0 LTS is frozen at Git tag `discord-reference-adapter-v3.6.0-lts`. Its platform release identity is now Discord Adapter v1.0.0, compatible with Collection Platform v4.x.

Version 4.0 introduces adapter detection, registry and manifests, canonical UI translation, normalized discovery, host abstraction, runtime policy, collection intent, executable mission profiles, Knowledge Object 1.0, and complete acquisition provenance. The stable Discord implementation is wrapped rather than rewritten.

No X, Reddit, AI reasoning, search automation, permission bypass, or historical acquisition redesign is included.

### Validation

- All manifest scripts parse and exist.
- Platform-core tests prove confidence selection and operation without a Discord global.
- Discord recovery, deduplication, concurrency, topology, and acquisition isolation regressions pass.
- Live authenticated Discord acceptance remains governed by `docs/FINAL_VALIDATION.md`.

---

# Previous Release Notes — v3.6.0

## Server Topology Discovery

Version 3.6.0 adds an independent server inventory path. From an open Discord server, operators can export the topology metadata already exposed to the authenticated client as JSON or Markdown.

The export includes server identity, categories, channels, forums, and threads when Discord renders their metadata. Channels are classified as `collectible` or `known-unreadable`, with explicit navigation and collection booleans. Unknown objects are not synthesized.

The observer performs no message acquisition, navigation, API calls, background-tab creation, authentication, request modification, or permission bypass. Conversation Schema 2.0.0 and historical acquisition are unchanged.

### Validation

- 27 manifest JavaScript files pass syntax and existence validation.
- Eight automated tests pass, including topology structure, unreadable-channel safety, non-invention, acquisition isolation, checkpoint recovery, concurrency, and 30,000-element stress coverage.
- Live Discord DOM compatibility still requires the acceptance procedure in the Validation Handbook.

---

# Previous Release Notes — v3.5.1 LTS

## Configurable Long-Run Historical Acquisition

### Runtime policy

- Default maximum historical runtime is three hours per conversation.
- Operators can select 1, 3, 6, 12, or 24 hours, or enter a custom value from 5 to 1,440 minutes.
- The fixed attempt ceiling has been removed.
- Acquisition is not terminated by rate, efficiency, or message-throughput metrics.
- Runtime is checked before starting a new acquisition cycle; the active cycle always finishes cleanly.
- Stalls trigger rotating recovery actions and do not independently terminate collection.

### Recall time controls

- Added relative recall presets for 30 days, 90 days, one year, two years, and three years.
- Existing 24-hour, 48-hour, seven-day, and exact custom ranges remain supported.
- Saved profiles retain the selected recall range and runtime policy.

### Fixed

- Large historical collections no longer depend solely on the final rendered Discord viewport.
- Messages are accumulated and deduplicated during every historical loading cycle, preventing DOM virtualization from discarding already acquired history.
- Message-jump URLs are normalized to the conversation before historical collection and restored afterward.
- Navigation uses retries and channel-anchor interaction when available.
- Batch items receive one automatic retry before being classified as failed.

### Added

- Acquisition runtime and elapsed-time fields in reports and checkpoints
- Acquisition checkpoints in Chrome local storage
- Accumulated-message count
- Recovery count
- Coverage status, earliest/latest acquired timestamps, and confidence
- Progress diagnostics

### Retired

- Targeted Collection/native Discord search automation
- Attempt-count and rate-based acquisition termination

### Preserved

- Conversation Schema 2.0.0
- Identity Engine 1.0.0
- Current Conversation
- Navigate to cached channel
- Batch collection
- Saved profiles
- JSON and Markdown renderers
- Active-tab-only architecture

### Live acceptance required

- Multi-year collection using the default three-hour runtime
- Custom historical runtime validation
- Multi-year collection initiated from a message-jump URL
- Batch collection across at least ten channels
- Recovery after a temporary Discord loading stall
- Original URL restoration
