(() => {
  const DCE = globalThis.DCE;
  const STATES = new Set(["collectible", "known-unreadable"]);

  function channel(record) {
    const visibilityState = STATES.has(record.visibilityState) ? record.visibilityState : "known-unreadable";
    const canCollect = visibilityState === "collectible" && Boolean(record.canCollect);
    return {
      id: record.id, name: record.name || null, type: record.type || "unknown",
      categoryId: record.categoryId || null, position: Number.isFinite(record.position) ? record.position : null,
      topic: record.topic || null, collectible: canCollect, visibilityState,
      canNavigate: Boolean(record.canNavigate), canCollect,
      parentId: record.parentId || null, archived: record.archived ?? null, locked: record.locked ?? null
    };
  }

  function build(observation) {
    if (!observation?.server?.id) throw new Error("Topology discovery did not expose a server id.");
    const channels = (observation.channels || []).filter(item => item?.id).map(channel);
    const threads = channels.filter(item => item.type === "thread").map(item => ({
      id: item.id, name: item.name, parentId: item.parentId, archived: item.archived,
      locked: item.locked, collectible: item.collectible, visibilityState: item.visibilityState
    }));
    const forums = channels.filter(item => item.type === "forum").map(item => ({
      id: item.id, name: item.name, parentCategory: item.categoryId,
      collectible: item.collectible, visibilityState: item.visibilityState
    }));
    return {
      schemaName: "collection-platform-server-topology", schemaVersion: DCE.config.topologySchemaVersion,
      platform: "discord", generatedAt: new Date().toISOString(), observedAt: observation.observedAt || null,
      sourceUrl: observation.sourceUrl || null,
      server: { id: observation.server.id, name: observation.server.name || null },
      categories: (observation.categories || []).filter(item => item?.id || item?.name).map(item => ({
        id: item.id || null, name: item.name || null, position: Number.isFinite(item.position) ? item.position : null,
        collapsed: item.collapsed ?? null
      })),
      channels, threads, forums,
      statistics: {
        categories: (observation.categories || []).filter(item => item?.id || item?.name).length,
        channels: channels.length, threads: threads.length, forums: forums.length,
        collectible: channels.filter(item => item.visibilityState === "collectible").length,
        knownUnreadable: channels.filter(item => item.visibilityState === "known-unreadable").length
      }
    };
  }

  DCE.topologyModel = { build };
})();
