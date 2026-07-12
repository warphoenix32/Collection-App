(() => {
  const DCE = globalThis.DCE;
  async function acquire(strategy, request) {
    DCE.discord.collector.resetAcquisitionBuffer?.();
    if (strategy === "current") {
      const originalUrl = location.href;
      const canonicalUrl = DCE.discord.navigation.canonicalConversationUrl(originalUrl);
      const shouldNormalize = Boolean(request?.options?.loadOlder && request?.options?.startIso && canonicalUrl !== originalUrl);
      if (shouldNormalize) await DCE.discord.navigation.navigateWithinDiscord(canonicalUrl);
      return { strategy: shouldNormalize ? "current-normalized" : strategy, originalUrl, restored: !shouldNormalize, source: DCE.discord.navigation.describeCurrentConversation() };
    }
    if (strategy === "navigate") {
      const originalUrl = location.href;
      await DCE.discord.navigation.navigateWithinDiscord(request.target.url);
      return { strategy, originalUrl, restored: location.href === originalUrl, source: DCE.discord.navigation.describeCurrentConversation(request.target) };
    }
    throw new Error(`Unsupported acquisition strategy: ${strategy}`);
  }
  async function restore(context) {
    if (!context || !["navigate","current-normalized"].includes(context.strategy)) return true;
    if (location.href !== context.originalUrl) await DCE.discord.navigation.navigateWithinDiscord(context.originalUrl);
    return true;
  }
  DCE.acquisition = { acquire, restore };
})();
