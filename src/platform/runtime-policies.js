(() => {
  const DCE = globalThis.DCE;
  const defaults = Object.freeze({
    historicalRuntimeMs: DCE.config.acquisitionDefaultMaxRuntimeMs,
    checkpointEveryCycles: DCE.config.loadOlderProgressLogInterval,
    retryCount: DCE.config.batchItemRetryCount,
    recovery: "adaptive",
    exportBehavior: "download"
  });
  function historicalRuntimeMs(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return defaults.historicalRuntimeMs;
    return Math.min(
      Math.max(Math.round(numeric), DCE.config.acquisitionMinimumMaxRuntimeMs),
      DCE.config.acquisitionMaximumMaxRuntimeMs
    );
  }
  function resolve(policy = {}) {
    policy = policy && typeof policy === "object" ? policy : {};
    return Object.freeze({ ...defaults, ...policy,
      historicalRuntimeMs: historicalRuntimeMs(policy.historicalRuntimeMs) });
  }
  DCE.runtimePolicies = { defaults, resolve, historicalRuntimeMs };
})();
