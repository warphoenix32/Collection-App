# Changelog

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
