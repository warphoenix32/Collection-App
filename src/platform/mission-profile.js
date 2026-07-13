(() => {
  const DCE = globalThis.DCE;
  function normalize(profile = {}) {
    const now = new Date().toISOString();
    return {
      id: profile.id || DCE.sdk.createJobId("profile"), name: String(profile.name || "Collection Mission").trim(),
      schemaVersion: "2.0.0", createdAt: profile.createdAt || now, updatedAt: profile.updatedAt || now,
      platform: profile.platform || profile.targets?.[0]?.platform || DCE.platformRuntime?.manifest?.()?.platform || "unknown",
      strategy: profile.strategy || "batch", sources: profile.sources || profile.targets || [], targets: profile.targets || profile.sources || [],
      intent: DCE.collectionIntent.normalize(profile.intent?.id || profile.intent || "archival"),
      runtimePolicy: DCE.runtimePolicies.resolve(profile.runtimePolicy || { historicalRuntimeMs: profile.options?.maxRuntimeMs }),
      options: profile.options || {}, output: profile.output || { destination: "download", format: profile.options?.format || "json" },
      schedule: profile.schedule || null
    };
  }
  DCE.missionProfile = { normalize };
})();
