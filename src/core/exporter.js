(() => {
  const DCE = globalThis.DCE;

  function downloadText(payload, filename, mimeType) {
    const blob = new Blob([payload], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.documentElement.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }

  function sanitizeFilename(value) {
    return String(value || "conversation")
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "conversation";
  }

  function filename(extension, source) {
    const name = source.conversation?.name || source.conversation?.id || "current-conversation";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${source.platform}-${sanitizeFilename(name)}-${stamp}.${extension}`;
  }

  function messageInRange(message, startIso, endIso) {
    const value = Date.parse(message.timestamp);
    if (!Number.isFinite(value)) return false;
    if (startIso && value < Date.parse(startIso)) return false;
    if (endIso && value > Date.parse(endIso)) return false;
    return true;
  }

  function buildAndDownload(rawMessages, options, source, collectionReport, startedAt, filenameSuffix = "") {
    const finishedAt = Date.now();
    const model = DCE.conversationModel.buildConversation({
      rawMessages, source, options: { ...options, format: "json", intent: "archival" },
      collectionReport, startedAt, finishedAt
    });
    const outputFilename = filename("json", model.source).replace(/\.json$/, `${filenameSuffix}.json`);
    downloadText(DCE.renderers.json(model), outputFilename, "application/json");
    return {
      success: true,
      count: model.collection.messageCount,
      participantCount: model.collection.participantCount,
      collectionComplete: model.collection.complete,
      warnings: model.diagnostics.warnings,
      earliestCollected: model.collection.actualRange.start,
      latestCollected: model.collection.actualRange.end,
      stopReason: collectionReport?.stopReason || null,
      outputFilename,
      exportId: model.metadata.exportId,
      source: model.source
    };
  }

  async function exportConversation(options, source) {
    const adapter = DCE.platformRuntime.requireAdapter();
    const startedAt = Date.now();
    options = { ...options, format: "json", intent: "archival" };
    let collectionReport = { complete: true, attempted: false, warnings: [] };
    if (options.loadOlder && options.startIso) {
      const runtimePolicy = DCE.runtimePolicies.resolve(options.runtimePolicy || { historicalRuntimeMs: options.maxRuntimeMs });
      collectionReport = await adapter.collector.loadHistorical(options.startIso, {
        maxRuntimeMs: runtimePolicy.historicalRuntimeMs,
        source,
        options,
        jobId: options.jobId
      });
    }
    const rawMessages = adapter.collector.parse()
      .filter(message => messageInRange(message, options.startIso, options.endIso));
    if (!rawMessages.length) return { success: false, error: "No messages matched the selected range." };
    return buildAndDownload(rawMessages, options, source, collectionReport, startedAt);
  }

  async function exportCheckpoint(checkpoint, reason = "recovery") {
    if (!checkpoint?.messages?.length) return { success: false, error: "No recoverable messages are available." };
    const options = { ...(checkpoint.options || {}), format: "json", intent: "archival" };
    const source = checkpoint.source || {
      platform: "discord", type: "unknown", acquisitionStrategy: "checkpoint-recovery",
      url: checkpoint.url, workspace: { id: null, name: null }, conversation: { id: null, name: "recovered-conversation" },
      platformMetadata: {}
    };
    const rawMessages = checkpoint.messages.filter(message => messageInRange(message, options.startIso, options.endIso));
    const collectionReport = {
      attempted: true,
      complete: false,
      stopReason: checkpoint.stopReason || reason,
      warnings: [`Partial archival export generated from a recovery checkpoint (${reason}).`],
      coverage: {
        status: "partial", startReached: false, confidence: "medium",
        requestedStart: checkpoint.cutoff || options.startIso || null,
        earliestAcquired: checkpoint.earliestLoaded || null,
        latestAcquired: checkpoint.latestLoaded || null
      },
      messagesAccumulated: rawMessages.length,
      cycles: checkpoint.cycles || 0,
      recoveries: checkpoint.recoveries || 0,
      resumed: true,
      resumedFrom: checkpoint.savedAt || null
    };
    return { ...buildAndDownload(rawMessages, options, source, collectionReport, Date.parse(checkpoint.savedAt) || Date.now(), "-partial"), partial: true };
  }

  async function exportEmergencyPartial(options, source, error) {
    const state = DCE.platformRuntime.requireAdapter().collector.getAcquisitionState?.();
    if (!state?.messages?.length) return { success: false, partial: false, error: "No messages had been buffered before the failure." };
    const checkpoint = {
      messages: state.messages,
      options,
      source,
      savedAt: new Date().toISOString(),
      cutoff: options.startIso || null,
      earliestLoaded: state.earliestCollected,
      latestLoaded: state.latestCollected,
      stopReason: "exception"
    };
    await DCE.cache.writeAcquisitionCheckpoint({ version: 3, complete: false, url: location.href, ...checkpoint });
    return exportCheckpoint(checkpoint, error?.message || "unexpected-failure");
  }

  function exportDiagnosticBundle(details = {}) {
    const payload = {
      schemaName: "collection-platform-diagnostic-bundle",
      schemaVersion: "1.0.0",
      generatedAt: new Date().toISOString(),
      platformVersion: DCE.config.platformVersion,
      adapterVersion: DCE.config.adapterVersion,
      page: { url: location.href, title: document.title },
      runtime: DCE.validation.runtimeReport(),
      job: details.job || null,
      checkpoint: details.checkpoint || null,
      failure: details.failure || null,
      logs: DCE.logger.snapshot()
    };
    const outputFilename = `collection-platform-diagnostics-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    downloadText(JSON.stringify(payload, null, 2), outputFilename, "application/json");
    return { success: true, outputFilename };
  }

  DCE.exporter = { exportConversation, exportCheckpoint, exportEmergencyPartial, exportDiagnosticBundle, downloadPayload: downloadText };
})();
