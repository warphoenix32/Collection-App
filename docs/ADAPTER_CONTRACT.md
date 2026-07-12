# Adapter Contract v1.0.0

A platform adapter must expose the capabilities required to translate a platform-specific conversation surface into the Collection Platform pipeline.

Required functions:

- `describeCurrentConversation()`
- `navigateWithinDiscord()` or platform-equivalent navigation
- `parseLoadedMessages()`
- `loadOlderMessagesUntil()`

Optional discovery functions:

- `scanServers()` / workspace discovery
- `scanChannels()` / conversation discovery

The current function names retain Discord-era compatibility. A future second adapter will drive the final platform-neutral naming revision.
