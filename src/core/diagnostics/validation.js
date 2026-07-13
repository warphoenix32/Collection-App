(() => {
  const DCE = globalThis.DCE;

  function runtimeReport() {
    const adapter = {
      platform: "discord",
      ...DCE.discord.discovery,
      ...DCE.discord.topology,
      ...DCE.discord.navigation,
      ...DCE.discord.collector
    };
    const contract = DCE.contracts.adapter.validate(adapter);
    return {
      timestamp: new Date().toISOString(),
      extensionVersion: DCE.config.extensionVersion,
      schemaVersion: DCE.config.schemaVersion,
      adapterContract: contract,
      capabilities: DCE.contracts.adapter.capabilities(adapter),
      architecturalChecks: {
        backgroundRuntime: false,
        secondAuthenticationPath: false,
        currentConversationStrategy: true,
        navigationStrategy: true,
        batchStrategy: Boolean(DCE.batch),
        profiles: Boolean(DCE.profiles),
        topologyExport: Boolean(DCE.topologyModel && DCE.topologyExporter)
      }
    };
  }

  DCE.validation = { runtimeReport };
})();
