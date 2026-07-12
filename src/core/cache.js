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

  DCE.cache = { readNavigationCache, writeNavigationCache };
})();
