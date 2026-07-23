# Collection Platform v4.1.0

## BLUF

Collection Platform is an adapter-driven Knowledge Acquisition Runtime. Discord Reference Adapter v1.1.0 is the first production adapter and preserves the Discord v3.6.0 LTS recovery baseline.

Version 4.1 makes archival JSON the canonical acquisition artifact. The collection popup no longer asks for output format or intent: every collection is archival and retains native identifiers, ISO timestamps, timezone-offset evidence, provenance, diagnostics, and honest coverage. Markdown remains a derived presentation format outside the collection path.

Platform detection selects the highest-confidence installed adapter. The adapter registry exposes capabilities, sources, entities, exports, runtime policies, topology support, and native UI terminology. Conversation Schema 2.x remains operational while Knowledge Object 1.0 is additive.

## Branch policy

- `main`: immutable production baseline, tagged `discord-reference-adapter-v3.6.0-lts`.
- `development`: Collection Platform v4 evolution and integration.

Experimental work does not occur on `main`.

## Final capability set

- Current conversation export, including DMs, group DMs, channels, threads, and rendered forum posts
- Single cached-channel navigation and restoration
- Sequential batch collection with retry and continue-on-error
- Saved collection profiles
- Canonical archival JSON exports using Conversation Schema 2.0.0
- Reliable historical acquisition that accumulates messages throughout Discord DOM virtualization
- Event-assisted pagination waits, rotating recovery actions, navigation retries, chunked IndexedDB checkpoints, and honest coverage metadata
- Persistent Collection Monitor with oldest/newest timestamps, partial download, checkpoint resume, discard, and diagnostic bundle actions
- Relative recall presets from 24 hours through three years
- Exact custom start and end timestamps
- Configurable historical runtime from five minutes through 24 hours, with a three-hour default
- Server Topology Discovery with canonical JSON inventory exports

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

The adapter performs recovery when Discord stalls and continues until it reaches the requested start date or the operator-selected active-runtime budget. Discord pagination waits do not consume that active budget. A separate 30-minute no-progress safety window prevents a permanently unresponsive page from running forever. The default active budget is three hours per conversation and can be set from five minutes through 24 hours.

Every ten cycles, the acquisition buffer is saved in 500-message IndexedDB chunks. If collection ends because of a runtime limit, no-progress condition, parser/export exception, popup closure, or later browser restart, the monitor can export the partial JSON or resume the exact incomplete checkpoint. A browser process that crashes cannot download at the instant of failure, so restart recovery is the durability boundary.

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
