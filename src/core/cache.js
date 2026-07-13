(() => {
  const DCE = globalThis.DCE;
  function key(name, legacyName) {
    try { return DCE.platformRuntime.manifest().storageKeys[name]; }
    catch (_) { return DCE.config[legacyName]; }
  }

  async function readNavigationCache() {
    const storageKey = key("navigationCache", "navigationCacheKey");
    const stored = await chrome.storage.local.get(storageKey);
    return stored[storageKey] || {
      servers: [],
      channelsByServer: {},
      current: null,
      updatedAt: null
    };
  }

  async function writeNavigationCache(cache) {
    await chrome.storage.local.set({ [key("navigationCache", "navigationCacheKey")]: cache });
    return cache;
  }

  async function readAcquisitionCheckpoint() {
    const storageKey = key("acquisitionCheckpoint", "acquisitionCheckpointKey");
    const stored = await chrome.storage.local.get(storageKey);
    return stored[storageKey] || null;
  }

  async function writeAcquisitionCheckpoint(checkpoint) {
    await chrome.storage.local.set({ [key("acquisitionCheckpoint", "acquisitionCheckpointKey")]: checkpoint });
    return checkpoint;
  }

  async function clearAcquisitionCheckpoint() {
    await chrome.storage.local.remove(key("acquisitionCheckpoint", "acquisitionCheckpointKey"));
  }

  DCE.cache = { readNavigationCache, writeNavigationCache, readAcquisitionCheckpoint, writeAcquisitionCheckpoint, clearAcquisitionCheckpoint };
})();
