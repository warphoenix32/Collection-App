(() => {
  const DCE = globalThis.DCE;

  async function readNavigationCache() {
    const stored = await chrome.storage.local.get(DCE.config.navigationCacheKey);
    return stored[DCE.config.navigationCacheKey] || {
      servers: [],
      channelsByServer: {},
      current: null,
      updatedAt: null
    };
  }

  async function writeNavigationCache(cache) {
    await chrome.storage.local.set({ [DCE.config.navigationCacheKey]: cache });
    return cache;
  }

  async function readAcquisitionCheckpoint() {
    const stored = await chrome.storage.local.get(DCE.config.acquisitionCheckpointKey);
    return stored[DCE.config.acquisitionCheckpointKey] || null;
  }

  async function writeAcquisitionCheckpoint(checkpoint) {
    await chrome.storage.local.set({ [DCE.config.acquisitionCheckpointKey]: checkpoint });
    return checkpoint;
  }

  async function clearAcquisitionCheckpoint() {
    await chrome.storage.local.remove(DCE.config.acquisitionCheckpointKey);
  }

  DCE.cache = { readNavigationCache, writeNavigationCache, readAcquisitionCheckpoint, writeAcquisitionCheckpoint, clearAcquisitionCheckpoint };
})();
