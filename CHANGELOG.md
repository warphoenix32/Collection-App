# Changelog

## 4.0.0 — Architecture Evolution

- Established independent Collection Platform 4.x and Discord Adapter 1.x versioning.
- Added confidence-based platform detection and adapter selection.
- Added adapter registry, self-describing manifests, compatibility metadata, and lifecycle state.
- Added canonical workspace/source UI translation with adapter-native labels.
- Added host abstraction, discovery framework, runtime policy, collection intent, executable mission profile, and Knowledge Object models.
- Routed acquisition, export, batch, topology, identity, provenance, and validation through the selected adapter facade.
- Preserved the Discord v3.6.0 LTS collector, parser, recovery, checkpoint, and conversation behavior.
- Added planner and plugin lifecycle architecture without AI reasoning or a second adapter.

## 3.6.0 — Server Topology Discovery

- Added observational Discord server topology discovery.
- Added independent topology model and JSON/Markdown renderers.
- Added current-server topology export in the popup.
- Preserved categories, forums, threads, and exposed unreadable channel metadata.
- Added topology capability reporting and eight-test regression gate.
- Kept topology discovery isolated from navigation, acquisition, Conversation Schema 2.x, and conversation exports.

## 3.5.2 LTS — Stability and Recovery

- Persist complete in-progress acquisition buffers so interrupted historical collection can resume.
- Persist bounded structured diagnostics in extension-local storage.
- Serialize operations to protect shared acquisition state.
- Restore the original Discord view even when export finds no matching messages.
- Correct initial in-app navigation and make timestamp bounds safe for large archives.
- Add dependency-free static, regression, recovery, concurrency, and stress tests.

## 3.5.1 LTS

- Replaced the fixed 3,000-cycle acquisition ceiling with a configurable runtime budget.
- Set the default historical acquisition runtime to three hours per conversation.
- Added 1, 3, 6, 12, and 24-hour runtime presets plus custom minutes.
- Added recall presets for 30 days, 90 days, and one, two, or three years.
- Runtime expiration now occurs only between acquisition cycles, allowing the active cycle to finish cleanly.
- Removed rate, efficiency, and attempt-count termination. Stalls invoke recovery and collection continues until the requested boundary or runtime budget.
- Added runtime policy and elapsed-time fields to acquisition reports and checkpoints.

## 3.5.0 LTS

- Replaced viewport-only historical parsing with an accumulated acquisition buffer.
- Added adaptive historical waits and bounded stall recovery.
- Added acquisition checkpoint metadata and progress logging.
- Added canonical conversation navigation for message-jump URLs.
- Added navigation retry and batch-item retry.
- Added additive collection coverage metadata.
- Retired Targeted Collection/native-search automation.
- Designated Discord as Collection Platform Reference Adapter v1.

## 3.0.0

- Added reusable adapter contract and capability declaration.
- Added Collection Platform SDK utilities.
- Added structured logging and runtime health reporting.
- Added multi-target batch collection with continue-on-error behavior.
- Added batch manifest downloads with per-target status.
- Added saved collection profiles stored in Chrome local storage.
- Added multi-select batch operator interface.
- Preserved Discord Adapter v2.0.1 parser behavior and Schema 2.0.0.
