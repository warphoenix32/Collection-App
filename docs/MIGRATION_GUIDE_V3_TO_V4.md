# Migration Guide — Discord v3.6 LTS to Platform v4

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
