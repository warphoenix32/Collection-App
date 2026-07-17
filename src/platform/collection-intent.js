(() => {
  const values = Object.freeze(["research", "historical", "monitoring", "archival", "compliance", "incident-response"]);
  function normalize(value = "archival") {
    value = value && typeof value === "object" ? value.id : value;
    const id = String(value).trim().toLowerCase().replace(/\s+/g, "-");
    if (!values.includes(id)) throw new Error(`Unsupported collection intent: ${value}`);
    return Object.freeze({ id, declaredAt: new Date().toISOString() });
  }
  globalThis.DCE.collectionIntent = { values, normalize };
})();
