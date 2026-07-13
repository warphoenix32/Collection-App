(() => {
  const DCE = globalThis.DCE;
  const adapters = new Map();
  const requiredManifest = ["id", "name", "version", "platform", "capabilities", "sources", "entities", "exports", "runtimePolicies", "ui"];

  function register(definition) {
    const missing = requiredManifest.filter(key => definition?.manifest?.[key] == null);
    if (missing.length) throw new Error(`Adapter manifest is missing: ${missing.join(", ")}`);
    if (typeof definition.detect !== "function" || typeof definition.createRuntime !== "function") throw new Error("Adapter requires detect() and createRuntime().");
    if (adapters.has(definition.manifest.id)) throw new Error(`Adapter already registered: ${definition.manifest.id}`);
    adapters.set(definition.manifest.id, Object.freeze(definition));
    return definition.manifest;
  }
  function list() { return Array.from(adapters.values()); }
  function get(id) { return adapters.get(id) || null; }
  function manifests() { return list().map(item => item.manifest); }

  DCE.adapterRegistry = { register, list, get, manifests, requiredManifest };
})();
