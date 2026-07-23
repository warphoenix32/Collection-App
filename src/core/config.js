(() => {
  const DCE = globalThis.DCE;
  DCE.config = Object.freeze({
    extensionVersion: "4.1.0",
    platformVersion: "4.1.0",
    adapterVersion: "1.1.0",
    schemaVersion: "2.0.0",
    identityEngineVersion: "1.0.0",
    topologySchemaVersion: "1.0.0",
    adapterContractVersion: "1.0.0",
    profileStorageKey: "collectionPlatformProfiles",
    diagnosticLogKey: "collectionPlatformDiagnosticLog",
    activeJobStorageKey: "collectionPlatformActiveJob",
    navigationRefreshDebounceMs: 250,
    navigationPathTimeoutMs: 12000,
    messageRenderTimeoutMs: 20000,
    navigationRetryCount: 3,
    navigationRetryDelayMs: 1200,
    batchItemRetryCount: 1,
    waitIntervalMs: 250,
    loadOlderInitialDelayMs: 700,
    loadOlderMaxWaitMs: 30000,
    loadOlderSoftStallLimit: 4,
    loadOlderProgressLogInterval: 10,
    loadOlderNoProgressLimitMs: 30 * 60 * 1000,
    checkpointEveryCycles: 10,
    checkpointChunkSize: 500,
    diagnosticLogMaxEntries: 1000,
    acquisitionDefaultMaxRuntimeMs: 3 * 60 * 60 * 1000,
    acquisitionMinimumMaxRuntimeMs: 5 * 60 * 1000,
    acquisitionMaximumMaxRuntimeMs: 24 * 60 * 60 * 1000,
    excludedMedia: ["gif", "video", "voice", "audio", "sticker"]
  });
})();
