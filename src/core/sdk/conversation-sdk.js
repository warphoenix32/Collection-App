(() => {
  const DCE = globalThis.DCE;

  function normalizeWhitespace(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function stableTargetId(target) {
    return [target.platform || "discord", target.serverId || "direct", target.channelId || target.conversationId || "unknown"].join(":");
  }

  function createJobId(prefix = "job") {
    return crypto.randomUUID ? `${prefix}-${crypto.randomUUID()}` : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function summarizeResult(target, result, startedAt, finishedAt) {
    return {
      targetId: stableTargetId(target),
      target,
      status: result?.success ? (result.collectionComplete ? "success" : "warning") : "failed",
      messageCount: result?.count || 0,
      participantCount: result?.participantCount || 0,
      collectionComplete: Boolean(result?.collectionComplete),
      warnings: result?.warnings || [],
      error: result?.error || null,
      durationMs: finishedAt - startedAt
    };
  }

  DCE.sdk = { normalizeWhitespace, stableTargetId, createJobId, summarizeResult };
})();
