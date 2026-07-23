# Migration Guide — Discord v3.6 LTS to Platform v4

## Version 4.1 stabilization

Collection Platform 4.1 and Discord Adapter 1.1 add archival-only JSON collection, native-context evidence, a persistent monitor, and chunked recovery checkpoints. The immutable v3.6 LTS baseline remains unchanged.

Saved profiles that request Markdown or a non-archival intent execute as archival JSON. Existing Markdown remains a valid historical artifact, and the renderer remains in source for compatibility, but Markdown is no longer the canonical ingestion boundary.

Version 2 checkpoints stored in Chrome local storage are still readable. New version 3 checkpoints are stored in IndexedDB chunks and include source/options metadata for exact resume and partial export.

## Recovery baseline

The exact v3.6.0 production source is tag `discord-reference-adapter-v3.6.0-lts` and branch `main`. Platform evolution occurs on `development`.

## Version mapping

- Extension/platform `3.6.0` → Collection Platform `4.0.0`.
- Embedded Discord implementation `3.6.0` → Discord Adapter `1.0.0`.
- Conversation Schema remains `2.0.0`.
- Existing topology exports remain schema `1.0.0`.

## Compatibility

Existing profiles, navigation cache, acquisition checkpoints, popup operations, export filenames, conversation JSON/Markdown, batch manifests, and topology exports remain supported. Legacy profile 1.0 records normalize in memory to executable mission profile 2.0 and preserve `targets` and `options`.

## Internal API mapping

| Discord-era method | Canonical adapter method |
|---|---|
| `describeCurrentConversation` | `navigation.describe` |
| `navigateWithinDiscord` | `navigation.navigate` |
| `canonicalConversationUrl` | `navigation.canonicalize` |
| `updateNavigationCache` | `navigation.updateCache` |
| `parseLoadedMessages` | `collector.parse` |
| `loadOlderMessagesUntil` | `collector.loadHistorical` |

The Discord methods remain in the adapter as the production implementation; reusable core consumes only canonical aliases.
