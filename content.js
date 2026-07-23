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
      request.options = { ...(request.options || {}), format: "json", intent: "archival" };
      context = await DCE.acquisition.acquire(request.strategy, request);
      const job = await DCE.jobState?.start?.({
        strategy: request.strategy,
        requestedRange: { start: request.options.startIso || null, end: request.options.endIso || null },
        source: context.source
      }) || { jobId: request.options.jobId || `job-${Date.now()}` };
      request.options.jobId = job.jobId;
      const result = await DCE.exporter.exportConversation(request.options, context.source);
      if (restoreAfter) restored = await DCE.acquisition.restore(context);
      await DCE.platformRuntime.requireAdapter().navigation.updateCache();
      await DCE.jobState?.finish?.({
        status: result.success ? (result.collectionComplete ? "completed" : "partial") : "failed",
        messagesAccumulated: result.count || 0,
        earliestCollected: result.earliestCollected || null,
        latestCollected: result.latestCollected || null,
        stopReason: result.stopReason || null,
        warnings: result.warnings || [],
        outputFilename: result.outputFilename || null,
        recoveryAvailable: !result.collectionComplete
      });
      return { ...result, restored };
    } catch (error) {
      const failure = DCE.errors?.classify?.(error, context ? "export" : "acquisition") || { code: "unexpected", message: error.message };
      DCE.logger.error("export.failed", { ...failure, strategy: request.strategy });
      let partial = null;
      if (context?.source) {
        try { partial = await DCE.exporter.exportEmergencyPartial(request.options || {}, context.source, error); }
        catch (partialError) { DCE.logger.error("export.partial.failed", DCE.errors.classify(partialError, "partial-export")); }
      }
      if (restoreAfter) {
        try { restored = await DCE.acquisition.restore(context); } catch (_) { restored = false; }
      }
      await DCE.jobState?.finish?.({
        status: partial?.success ? "partial" : "failed",
        stopReason: "exception",
        failure,
        messagesAccumulated: partial?.count || 0,
        earliestCollected: partial?.earliestCollected || null,
        latestCollected: partial?.latestCollected || null,
        outputFilename: partial?.outputFilename || null,
        recoveryAvailable: Boolean(partial?.success)
      });
      return { success: false, error: error.message, failure, partialDownloaded: Boolean(partial?.success), partial, restored };
    }
  }

  function checkpointSummary(checkpoint) {
    if (!checkpoint) return null;
    return {
      version: checkpoint.version,
      savedAt: checkpoint.savedAt,
      url: checkpoint.url,
      cutoff: checkpoint.cutoff,
      earliestLoaded: checkpoint.earliestLoaded,
      latestLoaded: checkpoint.latestLoaded,
      bufferedMessages: checkpoint.bufferedMessages ?? checkpoint.messages?.length ?? 0,
      cycles: checkpoint.cycles || 0,
      recoveries: checkpoint.recoveries || 0,
      complete: Boolean(checkpoint.complete),
      stopReason: checkpoint.stopReason || null,
      recoverable: !checkpoint.complete && Boolean(checkpoint.messages?.length)
    };
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
      request.options = { ...(request.options || {}), format: "json", intent: "archival" };
      ready.then(() => runExclusive("batch", () => DCE.batch.execute(request, executeExport))).then(sendResponse, error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "exportServerTopology") {
      ready.then(() => runExclusive("topology discovery", () => DCE.topologyExporter.exportServerTopology("json", { intent: "archival" })))
        .then(sendResponse, error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "getCollectionStatus") {
      ready.then(async () => {
        const checkpoint = await DCE.cache.readAcquisitionCheckpoint();
        sendResponse({ success: true, job: await DCE.jobState?.read?.() || null, checkpoint: checkpointSummary(checkpoint), activeOperation });
      }).catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "downloadRecoveryCheckpoint") {
      ready.then(() => runExclusive("partial recovery export", async () => {
        const checkpoint = await DCE.cache.readAcquisitionCheckpoint();
        return DCE.exporter.exportCheckpoint(checkpoint, "operator-request");
      })).then(sendResponse, error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "resumeRecoveryCheckpoint") {
      ready.then(() => runExclusive("checkpoint resume", async () => {
        const checkpoint = await DCE.cache.readAcquisitionCheckpoint();
        if (!checkpointSummary(checkpoint)?.recoverable) return { success: false, error: "No incomplete checkpoint is available." };
        if (checkpoint.url && location.href !== checkpoint.url) await DCE.platformRuntime.requireAdapter().navigation.navigate(checkpoint.url);
        return executeExport({ strategy: "current", options: { ...(checkpoint.options || {}), startIso: checkpoint.cutoff || checkpoint.options?.startIso } });
      })).then(sendResponse, error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "discardRecoveryCheckpoint") {
      ready.then(async () => {
        await DCE.cache.clearAcquisitionCheckpoint();
        sendResponse({ success: true });
      }).catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    }
    if (request.action === "exportDiagnosticBundle") {
      ready.then(async () => {
        const checkpoint = await DCE.cache.readAcquisitionCheckpoint();
        sendResponse(DCE.exporter.exportDiagnosticBundle({ job: await DCE.jobState?.read?.() || null, checkpoint: checkpointSummary(checkpoint), failure: request.failure || null }));
      }).catch(error => sendResponse({ success: false, error: error.message }));
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
      ready.then(async () => sendResponse({ success: true, report: DCE.validation.runtimeReport(), logs: DCE.logger.snapshot(), activeOperation, job: await DCE.jobState?.read?.() || null }), error => sendResponse({ success: false, error: error.message }));
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
