# Final Validation Handbook

## Platform v4 architecture gate

1. Confirm `main` and tag `discord-reference-adapter-v3.6.0-lts` resolve to the v3.6 production baseline.
2. Confirm development work is on `development`.
3. Confirm the registry rejects incomplete and duplicate adapter manifests.
4. Confirm detection selects the highest positive confidence and rejects unknown contexts.
5. Confirm reusable core and platform modules contain no Discord references or DOM selectors.
6. Confirm the Discord manifest reports Platform 4 compatibility, Adapter 1.0.0, capabilities, sources, entities, exports, policies, UI, and lifecycle.
7. Confirm popup terminology is supplied by the active adapter descriptor.
8. Confirm legacy profiles normalize to mission profile 2.0 without losing targets or options.
9. Confirm conversation exports retain Schema 2.x and include additive complete provenance.
10. Run all Discord historical, checkpoint, topology, batch, identity, JSON, and Markdown cases unchanged.

## Server Topology Discovery acceptance

1. Open a server with expanded and collapsed categories and export JSON and Markdown topology.
2. Confirm visible text and announcement channels are represented.
3. Confirm categories retain exposed IDs, names, order, and collapsed state.
4. Confirm forums and currently exposed threads appear in their dedicated arrays.
5. Confirm a rendered channel metadata node without a navigable link is `known-unreadable`, with `canNavigate`, `canCollect`, and `collectible` all false.
6. Confirm topology export causes no navigation, message loading, second authentication, background tab, or network/API automation.
7. Confirm objects for which Discord exposes no metadata are absent rather than synthesized.
8. Run current conversation, navigation, batch, checkpoint recovery, JSON, and Markdown regression cases unchanged.

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
