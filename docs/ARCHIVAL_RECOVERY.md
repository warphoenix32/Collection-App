# Archival Collection and Recovery

## Canonical artifact

Collection Platform 4.1 emits conversation JSON only. Every collection has `collectionIntent: archival`. This avoids information loss in Markdown and gives ingestion a stable representation for native IDs, UTC timestamps, source offsets, relationships, provenance, coverage, attachments, and diagnostics.

Markdown can be generated later from validated JSON when a reader-facing document is needed. It is not required for ingestion.

## Pagination behavior

- DOM mutation events wake pagination checks when Discord renders older messages.
- Ordinary pagination waits do not consume the active-runtime budget.
- Four consecutive soft stalls rotate through recovery inputs.
- Thirty minutes with no older message is a separate safety stop.
- The accumulated buffer survives Discord DOM virtualization.
- Parsed DOM elements are cached and timestamp bounds are maintained incrementally.

## Recovery behavior

The service worker stores checkpoint metadata plus 500-message chunks in IndexedDB every ten acquisition cycles and at a terminal boundary. Chrome local storage remains a fallback if IndexedDB messaging is unavailable.

Open **Collection Monitor** to see:

- current status and stage;
- message count;
- oldest and newest collected UTC timestamps;
- last progress and checkpoint time;
- cycles and recovery count;
- requested range and stop reason.

An incomplete checkpoint can be downloaded immediately as partial JSON, resumed, or explicitly discarded. Unexpected in-page failures attempt an immediate partial download. If Chrome terminates before JavaScript can download, reopen Discord and the popup; the saved checkpoint is announced and remains available in Collection Monitor.

## Failure evidence

Failures include a stable code, stage, message, retryability, and UTC occurrence time. The diagnostic bundle contains platform/adapter versions, page context, runtime validation, job/checkpoint summaries, the failure record, and bounded structured logs.

## Native Discord evidence

When Discord exposes the values, each normalized message retains:

- guild, channel, message, reply-target, and directly observed author IDs;
- canonical jump link;
- original `time[datetime]` ISO value and its `Z` or numeric offset;
- original rendered element ID.

Unknown or inferred native values remain `null`. The adapter does not manufacture IDs or convert display names into identities.
