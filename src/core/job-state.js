(() => {
  const DCE = globalThis.DCE;
  let current = null;

  async function persist() {
    if (chrome.storage?.local && current) {
      await chrome.storage.local.set({ [DCE.config.activeJobStorageKey]: current });
    }
    return current;
  }

  async function start(details = {}) {
    current = {
      jobId: details.jobId || (crypto.randomUUID ? crypto.randomUUID() : `job-${Date.now()}`),
      status: "running",
      stage: details.stage || "acquiring",
      intent: "archival",
      format: "json",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messagesAccumulated: 0,
      ...details
    };
    return persist();
  }

  async function update(details = {}) {
    if (!current) await start();
    current = { ...current, ...details, updatedAt: new Date().toISOString() };
    return persist();
  }

  async function finish(details = {}) {
    return update({ status: details.status || "completed", stage: "finished", finishedAt: new Date().toISOString(), ...details });
  }

  async function read() {
    if (current) return current;
    const stored = await chrome.storage.local.get(DCE.config.activeJobStorageKey);
    current = stored[DCE.config.activeJobStorageKey] || null;
    return current;
  }

  DCE.jobState = { start, update, finish, read };
})();
