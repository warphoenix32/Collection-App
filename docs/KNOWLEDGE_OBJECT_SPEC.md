# Knowledge Object Specification 1.0

A Knowledge Object is the additive next-generation artifact envelope. Conversation Schema 2.x remains operational.

Required:

- `identity.id`: stable source or platform identity.
- `source.original`: original source locator.

Canonical fields:

- `identity`
- `content`
- `relationships`
- `metadata`
- `source`
- `platform`
- `provenance`
- `confidence`
- `attachments`
- `createdAt`

Confidence is explicit or null; it is never fabricated. Relationships reference object identities. Attachments retain source availability and acquisition status. Provenance records platform, adapter/platform/collector versions, intent, policy, collection time, method, and original source.

`DCE.knowledgeObject.create(input)` validates the minimal envelope. Conversation-to-Knowledge-Object migration is deliberately deferred until requirements define lossless mapping.
