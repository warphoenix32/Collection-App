# Collection Platform SDK

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
