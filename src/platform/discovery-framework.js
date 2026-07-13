(() => {
  const DCE = globalThis.DCE;
  const kinds = Object.freeze(["capability", "source", "entity", "relationship", "topology"]);
  async function discover(adapter, kind, request = {}) {
    if (!kinds.includes(kind)) throw new Error(`Unsupported discovery kind: ${kind}`);
    const handler = adapter?.discovery?.[kind];
    if (typeof handler !== "function") return { kind, supported: false, items: [] };
    const result = await handler(request);
    return { kind, supported: true, adapterId: adapter.manifest.id, observedAt: new Date().toISOString(), ...result };
  }
  DCE.discoveryFramework = { kinds, discover };
})();
