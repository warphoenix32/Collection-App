(() => {
  const DCE = globalThis.DCE;
  const entries = [];
  const maxEntries = 500;

  function write(level, event, details = {}) {
    const entry = { timestamp: new Date().toISOString(), level, event, details };
    entries.push(entry);
    if (entries.length > maxEntries) entries.shift();
    const fn = level === "error" ? console.error : (level === "warn" ? console.warn : console.log);
    fn(`[Collection Platform] ${event}`, details);
    return entry;
  }

  function snapshot() { return entries.slice(); }
  function clear() { entries.length = 0; }

  DCE.logger = {
    info: (event, details) => write("info", event, details),
    warn: (event, details) => write("warn", event, details),
    error: (event, details) => write("error", event, details),
    snapshot,
    clear
  };
})();
