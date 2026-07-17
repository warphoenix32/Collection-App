# Collection Platform SDK

## Adapter registration

```text
DCE.adapterRegistry.register({ manifest, detect, createRuntime })
```

`detect(context)` returns confidence from 0 through 1 and must have no side effects. `createRuntime({ host, manifest })` returns canonical `navigation`, `collector`, `discovery`, and optional `topology` interfaces. The registry rejects incomplete manifests and duplicate IDs.

## Platform runtime

- `DCE.platformRuntime.initialize(host)` detects and activates one adapter.
- `DCE.platformRuntime.requireAdapter()` returns the active canonical runtime.
- `DCE.platformRuntime.manifest()` returns its self-description.
- `DCE.detectionEngine.detect(context)` returns the winning adapter, confidence, and candidate evidence.

## Policies, intent, and missions

- `DCE.runtimePolicies.resolve(policy)` overlays explicit mission policy on platform defaults.
- `DCE.collectionIntent.normalize(value)` validates research, historical, monitoring, archival, compliance, or incident-response intent.
- `DCE.missionProfile.normalize(profile)` upgrades legacy profiles into executable mission schema 2.0.

## Knowledge Objects

`DCE.knowledgeObject.create(input)` validates and creates Knowledge Object 1.0. Conversation Schema remains a separate operational output.

## Topology adapter capability

Adapters may expose `discoverServerTopology()`. The function returns a source observation:

```text
{
  server: { id, name },
  categories: [{ id, name, position, collapsed }],
  channels: [{
    id, name, type, categoryId, position, topic,
    visibilityState, collectible, canNavigate, canCollect,
    parentId, archived, locked
  }],
  observedAt,
  sourceUrl
}
```

The adapter must use only metadata legitimately exposed to the authenticated client. It must not return guessed or synthesized objects.

## Topology model

`DCE.topologyModel.build(observation)` produces schema `collection-platform-server-topology` version `1.0.0`. It filters channel records without source IDs, normalizes the two supported visibility states, and derives thread, forum, and statistics views.

## Renderers and exporter

- `DCE.renderers.topologyJson(topology)`
- `DCE.renderers.topologyMarkdown(topology)`
- `DCE.topologyExporter.exportServerTopology(format)`

Topology output is independent of Conversation Schema 2.x. Adding topology capability does not change the required conversation adapter contract; capability reporting advertises it separately as `topologyDiscovery`.
