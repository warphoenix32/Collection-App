(() => {
  const DCE = globalThis.DCE;
  DCE.discord.adapterManifest = Object.freeze({
    id: "discord-reference", name: "Discord Reference Adapter", version: "1.0.1", platform: "discord",
    compatibility: { platform: ">=4.0.0 <5.0.0", conversationSchema: "2.x", topologySchema: "1.x" },
    capabilities: Object.freeze({
      timeline: false, thread: true, forum: true, batch: true, search: false,
      topology: true, historicalAcquisition: true, media: "metadata-only", bookmarks: false
    }),
    sources: ["server", "channel", "direct-message", "group-direct-message", "forum-post"],
    entities: ["workspace", "category", "conversation", "message", "participant", "attachment", "thread", "forum"],
    exports: ["conversation-json", "conversation-markdown", "topology-json", "topology-markdown", "batch-manifest"],
    runtimePolicies: ["historicalRuntimeMs", "checkpointEveryCycles", "retryCount", "recovery", "exportBehavior"],
    topologySupport: true, historicalAcquisitionSupport: true,
    provenance: { acquisitionMethod: "browser-dom", confidence: "observed" },
    storageKeys: { navigationCache: "discordNavigationCache", acquisitionCheckpoint: "discordAcquisitionCheckpoint" },
    ui: {
      labels: {
        platform: "Discord", workspace: "Server", source: "Channel", current: "Current conversation",
        navigate: "Navigate to cached channel", batch: "Batch collection", profile: "Saved mission",
        collect: "Execute Collection", executeBatch: "Execute Batch Collection", topology: "Export Current Server Topology"
      },
      hints: {
        current: "Collects the current Discord conversation, including DMs, group DMs, threads, forums, and channels.",
        navigate: "Collects one passively cached Discord server channel and restores the original view.",
        batch: "Collects multiple cached Discord channels sequentially and downloads a batch manifest.",
        profile: "Runs a saved Discord collection mission."
      },
      operations: ["current", "navigate", "batch", "profile", "topology"]
    },
    lifecycle: { status: "production", installed: true, upgradePolicy: "compatible-major", retirement: null }
  });
})();
