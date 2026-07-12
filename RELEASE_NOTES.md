# Release Notes — v3.5.1 LTS

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
