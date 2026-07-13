(() => {
  const DCE = globalThis.DCE;
  async function acquire(strategy, request) {
    const adapter = DCE.platformRuntime.requireAdapter();
    adapter.collector.reset?.();
    if (strategy === "current") {
      const originalUrl = location.href;
      const canonicalUrl = adapter.navigation.canonicalize(originalUrl);
      const shouldNormalize = Boolean(request?.options?.loadOlder && request?.options?.startIso && canonicalUrl !== originalUrl);
      if (shouldNormalize) await adapter.navigation.navigate(canonicalUrl);
      return { strategy: shouldNormalize ? "current-normalized" : strategy, originalUrl, restored: !shouldNormalize, source: adapter.navigation.describe() };
    }
    if (strategy === "navigate") {
      const originalUrl = location.href;
      await adapter.navigation.navigate(request.target.url);
      return { strategy, originalUrl, restored: location.href === originalUrl, source: adapter.navigation.describe(request.target) };
    }
    throw new Error(`Unsupported acquisition strategy: ${strategy}`);
  }
  async function restore(context) {
    if (!context || !["navigate","current-normalized"].includes(context.strategy)) return true;
    if (location.href !== context.originalUrl) await DCE.platformRuntime.requireAdapter().navigation.navigate(context.originalUrl);
    return true;
  }
  DCE.acquisition = { acquire, restore };
})();
