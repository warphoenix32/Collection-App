(() => {
  const DCE = globalThis.DCE;
  let activeOperation = null;
  console.log(`Collection Platform ${DCE.config.extensionVersion} / Discord Adapter loaded.`);

  async function executeExport(request, execution = {}) {
    let context = null;
    let restored = true;
    const restoreAfter = execution.restoreAfter !== false;
    try {
      context = await DCE.acquisition.acquire(request.strategy, request);
      const result = await DCE.exporter.exportConversation(request.options, context.source);
      if (restoreAfter) restored = await DCE.acquisition.restore(context);
      await DCE.discord.navigation.updateNavigationCache();
      return { ...result, restored };
    } catch (error) {
      DCE.logger.error("export.failed", { error: error.message, strategy: request.strategy });
      if (restoreAfter) {
        try { restored = await DCE.acquisition.restore(context); } catch (_) { restored = false; }
      }
      return { success: false, error: error.message, restored };
    }
  }

  async function runExclusive(kind, operation) {
    if (activeOperation) return { success: false, error: `A ${activeOperation.kind} operation is already running.`, busy: true };
    activeOperation = { kind, startedAt: new Date().toISOString() };
    DCE.logger.info("operation.started", activeOperation);
    try { return await operation(); }
    finally {
      DCE.logger.info("operation.finished", { ...activeOperation, finishedAt: new Date().toISOString() });
      activeOperation = null;
    }
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "ping") {
      sendResponse({ success: true, version: DCE.config.extensionVersion, validation: DCE.validation.runtimeReport() });
      return;
    }
    if (request.action === "getNavigationSnapshot") {
      (async () => {
        try {
          const navigation = request.forceRefresh ? await DCE.discord.navigation.updateNavigationCache() : await DCE.cache.readNavigationCache();
          sendResponse({ success: true, navigation, currentConversation: DCE.discord.navigation.describeCurrentConversation(), profiles: await DCE.profiles.list(), validation: DCE.validation.runtimeReport() });
        } catch (error) { sendResponse({ success: false, error: error.message }); }
      })();
      return true;
    }
    if (request.action === "executeExport") {
      runExclusive("collection", () => executeExport(request)).then(sendResponse, error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "executeBatch") {
      runExclusive("batch", () => DCE.batch.execute(request, executeExport)).then(sendResponse, error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "saveProfile") {
      DCE.profiles.save(request.profile).then(profile => sendResponse({ success: true, profile })).catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "deleteProfile") {
      DCE.profiles.remove(request.profileId).then(profiles => sendResponse({ success: true, profiles })).catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "getRuntimeReport") {
      sendResponse({ success: true, report: DCE.validation.runtimeReport(), logs: DCE.logger.snapshot(), activeOperation });
      return;
    }
  });

  const adapter = { platform: "discord", ...DCE.discord.discovery, ...DCE.discord.navigation, ...DCE.discord.collector };
  const contract = DCE.contracts.adapter.validate(adapter);
  if (!contract.valid) DCE.logger.error("adapter.contract.invalid", contract);
  else DCE.logger.info("adapter.contract.valid", DCE.contracts.adapter.capabilities(adapter));
  DCE.discord.navigation.startNavigationObserver();
})();
