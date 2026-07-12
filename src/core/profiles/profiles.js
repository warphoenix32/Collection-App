(() => {
  const DCE = globalThis.DCE;

  async function list() {
    const stored = await chrome.storage.local.get(DCE.config.profileStorageKey);
    return stored[DCE.config.profileStorageKey] || [];
  }

  async function save(profile) {
    const profiles = await list();
    const now = new Date().toISOString();
    const normalized = {
      id: profile.id || DCE.sdk.createJobId("profile"),
      name: String(profile.name || "Collection Profile").trim(),
      createdAt: profile.createdAt || now,
      updatedAt: now,
      schemaVersion: "1.0.0",
      strategy: profile.strategy || "batch",
      targets: profile.targets || [],
      options: profile.options || {}
    };
    const index = profiles.findIndex(item => item.id === normalized.id);
    if (index >= 0) profiles[index] = normalized; else profiles.push(normalized);
    await chrome.storage.local.set({ [DCE.config.profileStorageKey]: profiles });
    return normalized;
  }

  async function remove(id) {
    const profiles = (await list()).filter(item => item.id !== id);
    await chrome.storage.local.set({ [DCE.config.profileStorageKey]: profiles });
    return profiles;
  }

  async function get(id) { return (await list()).find(item => item.id === id) || null; }

  DCE.profiles = { list, save, remove, get };
})();
