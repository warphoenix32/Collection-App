# Architecture Handbook

## Collection Platform v4

```text
Runtime Host
  → Platform Detection
  → Adapter Registry selection
  → Capability Discovery
  → Canonical operation
  → Adapter-native execution
  → Conversation or Knowledge Object output
```

`src/platform/` contains host, registry, detection, discovery, policy, intent, mission, UI, runtime, and Knowledge Object components. `src/adapters/<id>/` owns source-native detection and behavior. `src/core/` retains proven acquisition, normalization, orchestration, diagnostics, and export engines and accesses sources only through `platformRuntime.requireAdapter()`.

## Preserve the Known

The production Discord implementation is frozen at tag `discord-reference-adapter-v3.6.0-lts`. Platform v4 wraps its navigation, collector, parser, topology, identity, recovery, checkpoint, batch, and export behavior with canonical aliases. The adapter source remains the recovery reference.

## Canonical UI, native interface

Core UI state uses workspaces, sources, operations, and targets. Adapter manifests translate those concepts into platform-native labels. Discord therefore displays Server, Channel, Current Conversation, Batch Collection, and Export Server Topology. A second adapter supplies its own labels and operations without changing popup logic.

## Runtime hosts

The browser-extension host exposes context, storage, and time. Detection and registry code depend on the host contract rather than Chrome directly. Stable legacy engines still use browser globals for backward compatibility; new platform modules do not, except the host implementation. Future Playwright, official API, and desktop hosts implement the same boundary.

## Version boundaries

- Collection Platform: `4.x`.
- Discord Reference Adapter: `1.x`.
- Conversation Schema: `2.x`, unchanged.
- Knowledge Object: `1.x`, additive.
- Topology Schema: `1.x`.

## Pipeline boundaries

### Durable archival execution

The browser content runtime owns authenticated Discord DOM acquisition. A small persisted job record lets the popup-independent Collection Monitor report progress. The extension service worker owns chunked IndexedDB checkpoint persistence; the content runtime can rebuild an incomplete conversation from those chunks after popup closure or browser restart.

```text
Discord DOM -> Acquisition Buffer -> Chunked Checkpoint
                    |                       |
                    v                       v
            Canonical JSON Export    Resume / Partial JSON
```

Pagination wait time and active collection work are tracked separately. Mutation events wake the collector when Discord renders older messages. Rotating recovery continues through ordinary delays; only the operator-selected active-work budget or the independent no-progress safety window ends acquisition.

The model retains adapter-native evidence under `source.platformMetadata.discordContext` and `message.provenance.discordNative`. Core fields remain platform-neutral.

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
