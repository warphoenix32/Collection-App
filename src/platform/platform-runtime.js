(() => {
  const DCE = globalThis.DCE;
  let active = null;
  let detection = null;
  async function initialize(host = DCE.hosts.browserExtension) {
    detection = await DCE.detectionEngine.detect(host.context());
    active = detection.winner.createRuntime({ host, manifest: detection.winner.manifest });
    active.manifest = detection.winner.manifest;
    const contract = DCE.contracts?.adapter?.validate?.(active);
    if (contract && !contract.valid) {
      active = null;
      throw new Error(`Selected adapter does not satisfy the platform contract: ${contract.missing.join(", ")}`);
    }
    DCE.logger.info("platform.adapter.selected", { adapterId: active.manifest.id, confidence: detection.confidence });
    return active;
  }
  function requireAdapter() { if (!active) throw new Error("Platform adapter is not initialized."); return active; }
  function manifest() { return requireAdapter().manifest; }
  function report() { return { platformVersion: DCE.config.platformVersion, adapter: active ? DCE.uiTranslator.describe(active.manifest) : null, detection }; }
  DCE.platformRuntime = { initialize, requireAdapter, manifest, report };
})();
