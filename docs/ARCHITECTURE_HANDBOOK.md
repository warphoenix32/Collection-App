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

## Operation control

The platform operation controller serializes collection, batch, and topology work and exposes cooperative cancellation state. Adapters observe cancellation at safe boundaries; they do not terminate halfway through a parse or persistence step. The Discord historical collector preserves its accumulated buffer as a partial export, while batch orchestration marks unstarted targets as cancelled and restores the original source view.

Cancellation is a platform control-plane concern. Source-specific adapters decide where their safe interruption boundaries occur.

## Version boundaries

- Collection Platform: `4.x`.
- Discord Reference Adapter: `1.x`.
- Conversation Schema: `2.x`, unchanged.
- Knowledge Object: `1.x`, additive.
- Topology Schema: `1.x`.

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
