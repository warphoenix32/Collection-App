(() => {
  const DCE = globalThis.DCE;
  DCE.adapterRegistry.register({
    manifest: DCE.discord.adapterManifest,
    detect(context) { return /(^|\.)discord\.com$/i.test(context?.hostname || "") ? 1 : 0; },
    createRuntime({ host, manifest }) {
      return {
        host, manifest, platform: manifest.platform,
        navigation: {
          ...DCE.discord.navigation,
          describe: DCE.discord.navigation.describeCurrentConversation,
          navigate: DCE.discord.navigation.navigateWithinDiscord,
          canonicalize: DCE.discord.navigation.canonicalConversationUrl,
          updateCache: DCE.discord.navigation.updateNavigationCache,
          startObserver: DCE.discord.navigation.startNavigationObserver
        },
        collector: {
          ...DCE.discord.collector,
          reset: DCE.discord.collector.resetAcquisitionBuffer,
          loadHistorical: DCE.discord.collector.loadOlderMessagesUntil,
          parse: DCE.discord.collector.parseLoadedMessages
        },
        parser: DCE.discord.parser,
        topology: DCE.discord.topology,
        discovery: {
          capability: async () => ({ capabilities: manifest.capabilities }),
          source: async () => ({ items: DCE.discord.discovery.scanServers() }),
          entity: async request => ({ items: request.serverId ? DCE.discord.discovery.scanChannels(request.serverId) : [] }),
          relationship: async () => ({ items: [] }),
          topology: async () => ({ topology: DCE.discord.topology.discoverServerTopology() })
        },
        legacy: { navigation: DCE.discord.navigation, collector: DCE.discord.collector, discovery: DCE.discord.discovery }
      };
    }
  });
})();
