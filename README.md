# Collection Platform — Discord Reference Adapter v3.6.0

## BLUF

This is the final feature release of the Discord adapter. It preserves current-conversation, navigation, batch, profiles, normalized exports, and identity handling while replacing fragile historical loading with a fault-tolerant acquisition process.

## Final capability set

- Current conversation export, including DMs, group DMs, channels, threads, and rendered forum posts
- Single cached-channel navigation and restoration
- Sequential batch collection with retry and continue-on-error
- Saved collection profiles
- JSON and Markdown exports using Conversation Schema 2.0.0
- Reliable historical acquisition that accumulates messages throughout Discord DOM virtualization
- Adaptive waits, recovery actions, navigation retries, checkpoints, and honest coverage metadata
- Relative recall presets from 24 hours through three years
- Exact custom start and end timestamps
- Configurable historical runtime from five minutes through 24 hours, with a three-hour default
- Server Topology Discovery with independent JSON and Markdown inventory exports

## Server Topology Discovery

Open a server in the authenticated Discord tab and choose **Export Current Server Topology**. The observer inventories only metadata already rendered for that client: server, categories, channels, forums, and threads. It classifies message-bearing navigable objects as `collectible` and exposed but non-collectible metadata as `known-unreadable`.

Topology export does not navigate, load messages, call Discord APIs, open tabs, or alter the Conversation Schema. Discord may omit metadata for collapsed, archived, or inaccessible objects; absent objects are never invented.

## Retired capability

Targeted Collection/native-search automation is not included. It was retired because the Discord search UI was not reliable enough to justify continued maintenance.

## Install

1. Extract the ZIP.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Disable or remove the earlier build.
5. Select **Load unpacked** and choose this folder.
6. Refresh open Discord tabs.

## Historical acquisition behavior

Discord virtualizes messages: older rendered nodes can disappear as additional history loads. v3.5.1 parses and accumulates every rendered window during acquisition, then deduplicates the complete in-session buffer before export.

The adapter performs recovery when Discord stalls and continues until it reaches the requested start date or the operator-selected runtime budget. The default budget is three hours per conversation and can be set from five minutes through 24 hours. Runtime expiration is evaluated between loading cycles so the active cycle completes cleanly. Acquisition is not terminated by attempt count, throughput, or efficiency metrics. An incomplete result remains exportable but is explicitly reported as partial with coverage metadata and warnings.

## Architectural constraints

- Uses only the active authenticated Discord tab
- Creates no background Discord tabs
- Requires no second authentication
- Keeps Discord selectors inside the adapter
- Preserves the platform-neutral conversation schema

## Status

Discord Adapter: **Reference Adapter v1 / LTS**

Future work should be maintenance-only unless Discord changes its rendered interface.

## Engineering checks

Node.js 18 or newer is required only for development checks; the extension itself has no package dependencies.

```text
npm run check
```

On Windows systems that block PowerShell scripts, run the equivalent commands directly:

```text
node tests/static-check.js
node --test tests/*.test.js
```
