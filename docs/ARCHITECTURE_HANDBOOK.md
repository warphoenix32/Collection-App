# Architecture Handbook

## Pipeline boundaries

### Discovery

Discovery identifies source objects already exposed to the authenticated client. The Discord adapter's basic discovery supplies servers and navigable channels for operator selection.

### Topology Discovery

Topology Discovery is an observational branch of Discovery. It reads rendered source metadata and produces a normalized topology observation. It never navigates, acquires messages, changes permissions, or invents absent objects.

The platform-neutral topology model validates and normalizes the observation. Dedicated JSON and Markdown renderers serialize the topology schema independently of Conversation Schema 2.x.

```text
Discovery → Topology Discovery → Topology Model → Topology JSON/Markdown → Topology Export
```

### Navigation

Navigation changes the active source view to a known target and restores the operator's original location. Topology Discovery does not call it.

### Acquisition

Acquisition loads and accumulates message history from a navigable conversation. It feeds parsing and the Conversation Model. Topology Discovery does not call it and cannot collect unreadable channels.

```text
Discovery → Navigation → Acquisition → Parser → Conversation Model → Conversation Export
```

## Source-specific and reusable components

`src/adapters/discord/topology.js` owns Discord DOM interpretation. `src/core/topology-model.js`, topology renderers, and topology exporter own reusable normalization and serialization. Core topology modules do not query the Discord DOM.

## Safety invariant

Every exported channel is backed by an exposed Discord identifier. An absent identifier is not replaced with a guessed value. A metadata-bearing object that cannot be collected is classified `known-unreadable`; it is never passed to acquisition.
