(() => {
  const DCE = globalThis.DCE;
  async function detect(context, registry = DCE.adapterRegistry) {
    const candidates = [];
    for (const definition of registry.list()) {
      let confidence = 0;
      try { confidence = Number(await definition.detect(context)) || 0; }
      catch (error) { DCE.logger?.warn?.("adapter.detect.failed", { adapterId: definition.manifest.id, error: error.message }); }
      candidates.push({ definition, confidence: Math.max(0, Math.min(1, confidence)) });
    }
    candidates.sort((a, b) => b.confidence - a.confidence || a.definition.manifest.id.localeCompare(b.definition.manifest.id));
    const winner = candidates[0];
    const minimumConfidence = Number(DCE.config?.adapterDetectionMinimumConfidence) || 0.5;
    if (!winner || winner.confidence < minimumConfidence) {
      const best = winner ? ` Best candidate: ${winner.definition.manifest.id} (${Math.round(winner.confidence * 100)}%).` : "";
      throw new Error(`No installed adapter recognizes the active source with sufficient confidence.${best}`);
    }
    return { winner: winner.definition, confidence: winner.confidence, candidates: candidates.map(item => ({ id: item.definition.manifest.id, confidence: item.confidence })) };
  }
  DCE.detectionEngine = { detect };
})();
