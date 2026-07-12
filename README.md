# Collection Platform — Discord Reference Adapter v3.5.0 LTS

## BLUF

This is the final feature release of the Discord adapter. It preserves current-conversation, navigation, batch, profiles, normalized exports, and identity handling while replacing fragile historical loading with a fault-tolerant acquisition process.

## Final capability set

- Current conversation export, including DMs, group DMs, channels, threads, and rendered forum posts
- Single cached-channel navigation and restoration
- Sequential batch collection with retry and continue-on-error
- Saved collection profiles
- JSON and Markdown exports using Conversation Schema 2.0.0
- Reliable historical acquisition that accumulates messages throughout Discord DOM virtualization
- Adaptive waits, bounded stall recovery, navigation retries, checkpoints, and honest coverage metadata

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

Discord virtualizes messages: older rendered nodes can disappear as additional history loads. v3.5.0 parses and accumulates every rendered window during acquisition, then deduplicates the complete in-session buffer before export.

The adapter performs bounded recovery when Discord stalls. An incomplete result remains exportable but is explicitly reported as partial with coverage metadata and warnings.

## Architectural constraints

- Uses only the active authenticated Discord tab
- Creates no background Discord tabs
- Requires no second authentication
- Keeps Discord selectors inside the adapter
- Preserves the platform-neutral conversation schema

## Status

Discord Adapter: **Reference Adapter v1 / LTS**

Future work should be maintenance-only unless Discord changes its rendered interface.
