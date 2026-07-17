(() => {
  const DCE = globalThis.DCE;

  async function list() {
    const stored = await chrome.storage.local.get(DCE.config.profileStorageKey);
    return (stored[DCE.config.profileStorageKey] || []).map(profile => profile.schemaVersion === "2.0.0" ? profile : DCE.missionProfile.normalize(profile));
  }

  async function save(profile) {
    const profiles = await list();
    const normalized = DCE.missionProfile.normalize({ ...profile, updatedAt: new Date().toISOString() });
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
