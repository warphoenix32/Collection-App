(() => {
  const DCE = globalThis.DCE;
  const required = ["describeCurrentConversation", "navigateWithinDiscord", "parseLoadedMessages", "loadOlderMessagesUntil"];

  function validate(adapter) {
    const missing = required.filter(name => typeof adapter?.[name] !== "function");
    return { valid: missing.length === 0, missing };
  }

  function capabilities(adapter) {
    return Object.freeze({
      platform: adapter?.platform || "unknown",
      discovery: Boolean(adapter?.scanServers && adapter?.scanChannels),
      topologyDiscovery: Boolean(adapter?.discoverServerTopology),
      navigation: Boolean(adapter?.navigateWithinDiscord),
      currentConversation: Boolean(adapter?.describeCurrentConversation),
      historicalLoading: Boolean(adapter?.loadOlderMessagesUntil),
      normalization: Boolean(adapter?.parseLoadedMessages)
    });
  }

  DCE.contracts = DCE.contracts || {};
  DCE.contracts.adapter = { required, validate, capabilities };
})();
