(() => {
  const DCE = globalThis.DCE;
  function safeName(value) { return String(value || "server").replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/\s+/g, "-").slice(0, 80); }
  function exportServerTopology(format = "json", context = {}) {
    const adapter = DCE.platformRuntime.requireAdapter();
    const observation = adapter.topology.discoverServerTopology();
    const topology = DCE.topologyModel.build(observation, context);
    const json = format === "json";
    const payload = json ? DCE.renderers.topologyJson(topology) : DCE.renderers.topologyMarkdown(topology);
    const extension = json ? "json" : "md";
    const filename = `${adapter.manifest.platform}-${safeName(topology.server.name || topology.server.id)}-topology-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
    DCE.exporter.downloadPayload(payload, filename, json ? "application/json" : "text/markdown");
    DCE.logger.info("topology.export.completed", { serverId: topology.server.id, format, filename, statistics: topology.statistics });
    return { success: true, filename, topology, statistics: topology.statistics };
  }
  DCE.topologyExporter = { exportServerTopology };
})();
