# Collection Platform v4.0.1

## BLUF

Collection Platform is an adapter-driven Knowledge Acquisition Runtime. Discord Reference Adapter v1.0.1 is the first production adapter and preserves the complete Discord v3.6.0 LTS behavior baseline with additive operator-control fixes.

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
- JSON and Markdown exports using Conversation Schema 2.0.0
- Reliable historical acquisition that accumulates messages throughout Discord DOM virtualization
- Adaptive waits, recovery actions, navigation retries, checkpoints, and honest coverage metadata
- Relative recall presets from 24 hours through three years
- Exact custom start and end timestamps
- Configurable historical runtime from five minutes through 24 hours, with a three-hour default
- Server Topology Discovery with independent JSON and Markdown inventory exports
- Cooperative cancellation for long historical and batch collections
- Cancelled batches preserve completed/partial exports, mark unstarted targets, and restore the original view
- Confidence-gated adapter selection to prevent low-confidence adapters from claiming unsupported pages

## X compatibility

The packaged extension does not currently connect to X.com or X Pro (formerly TweetDeck). It intentionally does not scrape either interface: X requires automated collection to use its published interfaces unless the operator has separate written permission.

X Pro remains useful as an operator-facing monitoring workspace, but its rendered columns are not a supported acquisition source. A direct Collection Platform integration should use the official X API recent search, full-archive search, filtered stream, or webhook products. That requires an X developer project, operator-supplied credentials, explicit usage-cost controls, and API-specific provenance. See [`docs/X_INTEGRATION.md`](docs/X_INTEGRATION.md).

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

Discord virtualizes messages: older rendered nodes can disappear as additional history loads. The v3.6 reference implementation parses and accumulates every rendered window during acquisition, then deduplicates the complete in-session buffer before export.

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

Node.js 18 or newer is required only for development checks; the extension itself has no package dependencies. The validation suite is included in this package.

```text
npm run check
```

On Windows systems that block PowerShell scripts, run the equivalent commands directly:

```text
node tests/static-check.js
node --test tests/*.test.js
```

On Windows PowerShell installations that block `npm.ps1`, use:

```text
npm.cmd run check
```

See [`docs/README.md`](docs/README.md) for the documentation map and authority order.
