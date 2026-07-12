# Final Validation Handbook

## Static release gate

- Manifest parses as JSON.
- Every declared content script exists.
- Every JavaScript source file passes syntax validation.
- No background script, service worker, or new-tab collection path exists.
- Targeted Collection is absent from the UI and runtime.

## Live acceptance matrix

1. Current channel, visible messages.
2. Direct message.
3. Group direct message.
4. Forum post opened in Discord.
5. Custom historical range spanning at least one year.
6. Historical collection started from a message-jump URL.
7. Batch of at least ten cached channels.
8. Mixed-success batch and original-location restoration.
9. JSON and Markdown output parity.
10. Confirm partial runs expose warnings and `collection.coverage.status = partial`.

## Mission acceptance

A requested historical range must either:

- reach the requested start and report complete coverage, or
- produce a usable partial export that accurately reports the earliest acquired timestamp, recovery activity, and incomplete coverage.

It must never report an initial viewport as a complete multi-year collection.

## v3.5.1 live validation

- Confirm the default historical runtime shows three hours.
- Confirm 1, 3, 6, 12, and 24-hour presets serialize into the collection request.
- Confirm custom runtime rejects values below 5 or above 1,440 minutes.
- Confirm 30-day, 90-day, one-year, two-year, and three-year recall presets calculate valid UTC start timestamps.
- Confirm runtime expiration reports `stopReason: runtime-limit` and exports accumulated messages.
- Confirm no attempt-limit or rate-based termination occurs.
- Confirm repeated stalls invoke rotating recovery without independently ending the run.
- Confirm saved profiles preserve `maxRuntimeMs`.
