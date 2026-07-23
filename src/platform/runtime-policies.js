(() => {
  const DCE = globalThis.DCE;
  const defaults = Object.freeze({
    historicalRuntimeMs: DCE.config.acquisitionDefaultMaxRuntimeMs,
    checkpointEveryCycles: DCE.config.checkpointEveryCycles,
    retryCount: DCE.config.batchItemRetryCount,
    recovery: "adaptive",
    exportBehavior: "download"
  });
  function resolve(policy = {}) {
    return Object.freeze({ ...defaults, ...policy,
      historicalRuntimeMs: Number.isFinite(Number(policy.historicalRuntimeMs)) ? Number(policy.historicalRuntimeMs) : defaults.historicalRuntimeMs });
  }
  DCE.runtimePolicies = { defaults, resolve };
})();
