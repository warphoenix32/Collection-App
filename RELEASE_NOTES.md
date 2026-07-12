# Release Notes — v3.5.0 LTS

## Reliable Historical Acquisition

### Fixed

- Large historical collections no longer depend solely on the final rendered Discord viewport.
- Messages are accumulated and deduplicated during every historical loading cycle, preventing DOM virtualization from discarding already acquired history.
- Message-jump URLs are normalized to the conversation before historical collection and restored afterward.
- Historical loading uses adaptive waits and bounded recovery instead of declaring a terminal failure after a handful of unchanged checks.
- Navigation uses retries and channel-anchor interaction when available.
- Batch items receive one automatic retry before being classified as failed.

### Added

- Acquisition checkpoints in Chrome local storage
- Accumulated-message count
- Recovery count
- Coverage status, earliest/latest acquired timestamps, and confidence
- Progress diagnostics

### Retired

- Targeted Collection/native Discord search automation

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

- Multi-year collection from the latest channel view
- Multi-year collection initiated from a message-jump URL
- Batch collection across at least ten channels
- Recovery after a temporary Discord loading stall
- Original URL restoration
