(() => {
  const DCE = globalThis.DCE;
  function create(input = {}) {
    if (!input.identity?.id || !input.source?.original) throw new Error("Knowledge Object requires identity.id and source.original.");
    return {
      schemaName: "collection-platform-knowledge-object", schemaVersion: "1.0.0",
      identity: input.identity, content: input.content || {}, relationships: input.relationships || [], metadata: input.metadata || {},
      source: input.source, platform: input.platform || "unknown",
      provenance: input.provenance || {}, confidence: Number.isFinite(input.confidence) ? input.confidence : null,
      attachments: input.attachments || [], createdAt: input.createdAt || new Date().toISOString()
    };
  }
  DCE.knowledgeObject = { create };
})();
