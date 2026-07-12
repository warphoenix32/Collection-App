# Collection Platform Conversation Schema 2.0.0

## Purpose

A platform-neutral export contract produced by adapters and consumed by renderers, AI processing, validation, and future Collection Platform engines.

## Top-Level Objects

- `metadata`: schema, collector, adapter, export identity, and timestamps.
- `source`: platform, acquisition strategy, conversation type, source URL, workspace, and conversation identity.
- `collection`: requested and actual ranges, completeness, duration, counts, and loading report.
- `participants`: normalized participant records.
- `messages`: ordered normalized message records referencing participants.
- `diagnostics`: warnings, identity gaps, inference counts, skipped records, and excluded media.
- `provenance`: how the normalized export was produced.

## Compatibility Rule

Adapters may add information under `source.platformMetadata` and message provenance. Core schema fields must not depend on Discord DOM concepts.
