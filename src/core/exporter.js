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

  async function exportConversation(options, source) {
    const adapter = DCE.platformRuntime.requireAdapter();
    const startedAt = Date.now();
    let collectionReport = { complete: true, attempted: false, warnings: [] };
    if (options.loadOlder && options.startIso) {
      const runtimePolicy = DCE.runtimePolicies.resolve(options.runtimePolicy || { historicalRuntimeMs: options.maxRuntimeMs });
      collectionReport = await adapter.collector.loadHistorical(options.startIso, { maxRuntimeMs: runtimePolicy.historicalRuntimeMs });
    }
    const rawMessages = adapter.collector.parse()
      .filter(message => messageInRange(message, options.startIso, options.endIso));
    if (!rawMessages.length) return { success: false, error: "No messages matched the selected range." };

    const finishedAt = Date.now();
    const model = DCE.conversationModel.buildConversation({
      rawMessages, source, options, collectionReport, startedAt, finishedAt
    });
    const isJson = options.format === "json";
    const payload = isJson ? DCE.renderers.json(model) : DCE.renderers.markdown(model);
    const outputFilename = filename(isJson ? "json" : "md", model.source);
    downloadText(payload, outputFilename, isJson ? "application/json" : "text/markdown");

    return {
      success: true,
      count: model.collection.messageCount,
      participantCount: model.collection.participantCount,
      collectionComplete: model.collection.complete,
      warnings: model.diagnostics.warnings,
      outputFilename,
      exportId: model.metadata.exportId,
      source: model.source
    };
  }

  DCE.exporter = { exportConversation, downloadPayload: downloadText };
})();
