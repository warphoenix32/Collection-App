(() => {
  globalThis.DCE.renderers.topologyJson = topology => JSON.stringify(topology, null, 2);
})();
