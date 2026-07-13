(() => {
  const DCE = globalThis.DCE;
  const entries = [];
  const maxEntries = DCE.config.diagnosticLogMaxEntries || 1000;
  let persistTimer = null;

  function persistSoon() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      chrome.storage?.local?.set({ [DCE.config.diagnosticLogKey]: entries }).catch(() => {});
    }, 250);
  }

  async function restore() {
    try {
      const stored = await chrome.storage.local.get(DCE.config.diagnosticLogKey);
      const prior = stored[DCE.config.diagnosticLogKey];
      if (Array.isArray(prior)) {
        entries.unshift(...prior.slice(-maxEntries));
        if (entries.length > maxEntries) entries.splice(0, entries.length - maxEntries);
      }
    } catch (_) {}
  }

  function write(level, event, details = {}) {
    const entry = { timestamp: new Date().toISOString(), level, event, details };
    entries.push(entry);
    if (entries.length > maxEntries) entries.shift();
    persistSoon();
    const fn = level === "error" ? console.error : (level === "warn" ? console.warn : console.log);
    fn(`[Collection Platform] ${event}`, details);
    return entry;
  }

  function snapshot() { return entries.slice(); }
  function clear() { entries.length = 0; persistSoon(); }

  DCE.logger = {
    info: (event, details) => write("info", event, details),
    warn: (event, details) => write("warn", event, details),
    error: (event, details) => write("error", event, details),
    snapshot,
    clear,
    ready: restore()
  };
})();
