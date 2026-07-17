(() => {
  const DCE = globalThis.DCE;

  function runtimeReport() {
    const adapter = DCE.platformRuntime.requireAdapter();
    const contract = DCE.contracts.adapter.validate(adapter);
    return {
      timestamp: new Date().toISOString(),
      extensionVersion: DCE.config.extensionVersion,
      platformVersion: DCE.config.platformVersion,
      adapter: DCE.uiTranslator.describe(adapter.manifest),
      registry: DCE.adapterRegistry.manifests().map(item => ({ id: item.id, version: item.version, platform: item.platform, capabilities: item.capabilities })),
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
