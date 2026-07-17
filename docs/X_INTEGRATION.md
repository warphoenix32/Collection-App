# X Integration Boundary

## Current status

Collection Platform v4.0.1 has no installed X adapter. The manifest grants access only to Discord, and the only production adapter is the Discord Reference Adapter. Opening X.com or X Pro therefore cannot initialize this runtime.

X Pro, formerly TweetDeck, is an operator-facing X interface for columns, advanced search, filters, Lists, and monitoring. It is not a separate data provider and does not create a permitted scraping boundary.

## Supported future architecture

Programmatic X collection must use a published X interface unless the operator has separate written permission from X:

```text
X API search, filtered stream, or webhook
  -> credentialed API host
  -> X API adapter
  -> canonical Collection Platform models
  -> Conversation Schema or Knowledge Object export
```

The browser DOM, undocumented internal endpoints, session cookies, and X Pro columns are not supported acquisition interfaces.

## Adapter requirements

A production X API adapter should:

- Keep credentials outside source control and outside exported artifacts.
- Use X API v2 for new work.
- Require an explicit operator query, rule, account, List, or conversation target.
- Enforce operator-configured spending, pagination, result, and time limits.
- Record endpoint, query or rule, requested fields, pagination, API errors, and coverage in provenance.
- Normalize Post IDs, author IDs, conversation IDs, timestamps, text, references, edits, media metadata, and source URLs without inventing unavailable fields.
- Handle rate limits, depleted credits, partial pages, stream reconnects, and compliance/deletion events honestly.
- Keep all X-specific behavior under `src/adapters/x/` and an API-capable host; reusable core must remain adapter-neutral.

## Available official collection modes

- Recent search for Posts from the recent window.
- Full-archive search where the operator's access permits it.
- Filtered stream for near-real-time rules.
- Webhook delivery where the selected X product supports it.
- Account timelines and conversation queries for explicitly selected targets.

These modes require an approved developer account, an X Project and App, credentials, and sufficient credits or enterprise access. The current browser-only Discord package does not ask for, store, or transmit those credentials.

## Third-party services

A third-party monitoring provider is suitable only when it explicitly offers an API, webhook, feed, or export that authorizes downstream use. Collection Platform should integrate that published interface through its own adapter. Scraping the provider's dashboard merely moves the same fragility and authorization problem to another website.
