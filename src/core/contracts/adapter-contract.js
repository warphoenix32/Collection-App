(() => {
  const DCE = globalThis.DCE;
  const required = ["navigation.describe", "navigation.navigate", "collector.parse", "collector.loadHistorical"];

  function validate(adapter) {
    const missing = required.filter(path => typeof path.split(".").reduce((value, key) => value?.[key], adapter) !== "function");
    return { valid: missing.length === 0, missing };
  }

  function capabilities(adapter) {
    return Object.freeze({
      platform: adapter?.manifest?.platform || adapter?.platform || "unknown",
      discovery: Boolean(adapter?.discovery?.source && adapter?.discovery?.entity),
      topologyDiscovery: Boolean(adapter?.topology?.discoverServerTopology || adapter?.discovery?.topology),
      navigation: Boolean(adapter?.navigation?.navigate),
      currentConversation: Boolean(adapter?.navigation?.describe),
      historicalLoading: Boolean(adapter?.collector?.loadHistorical),
      normalization: Boolean(adapter?.collector?.parse)
    });
  }

  DCE.contracts = DCE.contracts || {};
  DCE.contracts.adapter = { required, validate, capabilities };
})();
