(() => {
  const DCE = globalThis.DCE;
  DCE.config = Object.freeze({
    extensionVersion: "3.5.0",
    adapterVersion: "3.5.0",
    schemaVersion: "2.0.0",
    identityEngineVersion: "1.0.0",
    platformVersion: "3.5.0",
    adapterContractVersion: "1.0.0",
    profileStorageKey: "collectionPlatformProfiles",
    navigationCacheKey: "discordNavigationCache",
    acquisitionCheckpointKey: "discordAcquisitionCheckpoint",
    navigationRefreshDebounceMs: 250,
    navigationPathTimeoutMs: 12000,
    messageRenderTimeoutMs: 20000,
    navigationRetryCount: 3,
    navigationRetryDelayMs: 1200,
    batchItemRetryCount: 1,
    waitIntervalMs: 250,
    loadOlderInitialDelayMs: 700,
    loadOlderMaxWaitMs: 8000,
    loadOlderMaxAttempts: 3000,
    loadOlderSoftStallLimit: 4,
    loadOlderHardStallLimit: 18,
    loadOlderMaxRecoveries: 8,
    loadOlderProgressLogInterval: 10,
    excludedMedia: ["gif", "video", "voice", "audio", "sticker"]
  });
})();
