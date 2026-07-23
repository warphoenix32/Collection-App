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
    try {
      if (chrome.runtime?.sendMessage) {
        const response = await chrome.runtime.sendMessage({ scope: "collectionCheckpoint", action: "read" });
        if (response?.success && response.value) return response.value;
        if (response && !response.success) throw new Error(response.error);
      }
    } catch (error) {
      DCE.logger?.warn?.("checkpoint.indexeddb.read.failed", { error: error.message });
    }
    const storageKey = key("acquisitionCheckpoint", "acquisitionCheckpointKey");
    const stored = await chrome.storage.local.get(storageKey);
    return stored[storageKey] || null;
  }

  async function writeAcquisitionCheckpoint(checkpoint) {
    if (chrome.runtime?.sendMessage) {
      try {
        const response = await chrome.runtime.sendMessage({
          scope: "collectionCheckpoint",
          action: "write",
          checkpoint,
          chunkSize: DCE.config.checkpointChunkSize || 500
        });
        if (response?.success) {
          await chrome.storage.local.remove(key("acquisitionCheckpoint", "acquisitionCheckpointKey"));
          return checkpoint;
        }
        if (response) throw new Error(response.error);
      } catch (error) {
        DCE.logger?.warn?.("checkpoint.indexeddb.write.failed", { error: error.message });
      }
    }
    await chrome.storage.local.set({ [key("acquisitionCheckpoint", "acquisitionCheckpointKey")]: checkpoint });
    return checkpoint;
  }

  async function clearAcquisitionCheckpoint() {
    try {
      if (chrome.runtime?.sendMessage) {
        const response = await chrome.runtime.sendMessage({ scope: "collectionCheckpoint", action: "clear" });
        if (response && !response.success) throw new Error(response.error);
      }
    } catch (error) {
      DCE.logger?.warn?.("checkpoint.indexeddb.clear.failed", { error: error.message });
    }
    await chrome.storage.local.remove(key("acquisitionCheckpoint", "acquisitionCheckpointKey"));
  }

  DCE.cache = { readNavigationCache, writeNavigationCache, readAcquisitionCheckpoint, writeAcquisitionCheckpoint, clearAcquisitionCheckpoint };
})();
