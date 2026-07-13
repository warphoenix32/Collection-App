(() => {
  const DCE = globalThis.DCE;
  let activeOperation = null;
  const ready = DCE.platformRuntime.initialize();
  console.log(`Collection Platform ${DCE.config.platformVersion} loaded.`);

  async function executeExport(request, execution = {}) {
    let context = null;
    let restored = true;
    const restoreAfter = execution.restoreAfter !== false;
    try {
      context = await DCE.acquisition.acquire(request.strategy, request);
      const result = await DCE.exporter.exportConversation(request.options, context.source);
      if (restoreAfter) restored = await DCE.acquisition.restore(context);
      await DCE.platformRuntime.requireAdapter().navigation.updateCache();
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
      ready.then(() => sendResponse({ success: true, version: DCE.config.platformVersion, validation: DCE.validation.runtimeReport() }), error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "getNavigationSnapshot") {
      ready.then(async () => {
        try {
          const adapter = DCE.platformRuntime.requireAdapter();
          const navigation = request.forceRefresh ? await adapter.navigation.updateCache() : await DCE.cache.readNavigationCache();
          sendResponse({ success: true, navigation, uiNavigation: DCE.uiTranslator.navigation(navigation), currentConversation: adapter.navigation.describe(), profiles: await DCE.profiles.list(), validation: DCE.validation.runtimeReport(), adapter: DCE.uiTranslator.describe(adapter.manifest) });
        } catch (error) { sendResponse({ success: false, error: error.message }); }
      }, error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "executeExport") {
      ready.then(() => runExclusive("collection", () => executeExport(request))).then(sendResponse, error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "executeBatch") {
      ready.then(() => runExclusive("batch", () => DCE.batch.execute(request, executeExport))).then(sendResponse, error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "exportServerTopology") {
      ready.then(() => runExclusive("topology discovery", () => DCE.topologyExporter.exportServerTopology(request.format, { intent: request.intent })))
        .then(sendResponse, error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "saveProfile") {
      ready.then(() => DCE.profiles.save(request.profile)).then(profile => sendResponse({ success: true, profile })).catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "deleteProfile") {
      DCE.profiles.remove(request.profileId).then(profiles => sendResponse({ success: true, profiles })).catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "getRuntimeReport") {
      ready.then(() => sendResponse({ success: true, report: DCE.validation.runtimeReport(), logs: DCE.logger.snapshot(), activeOperation }), error => sendResponse({ success: false, error: error.message }));
      return true;
    }
  });

  ready.then(adapter => {
    const contract = DCE.contracts.adapter.validate(adapter);
    if (!contract.valid) DCE.logger.error("adapter.contract.invalid", contract);
    else DCE.logger.info("adapter.contract.valid", DCE.contracts.adapter.capabilities(adapter));
    adapter.navigation.startObserver?.();
  }).catch(error => DCE.logger.error("platform.initialization.failed", { error: error.message }));
})();
