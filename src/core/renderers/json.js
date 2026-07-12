(() => {
  const DCE = globalThis.DCE;
  DCE.renderers = DCE.renderers || {};
  DCE.renderers.json = model => JSON.stringify(model, null, 2);
})();
