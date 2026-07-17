(() => {
  function describe(manifest) { return { adapterId: manifest.id, platform: manifest.platform, name: manifest.name, version: manifest.version, labels: manifest.ui.labels, hints: manifest.ui.hints || {}, operations: manifest.ui.operations }; }
  function navigation(view = {}) {
    const current = view.current ? { ...view.current, workspaceId: view.current.workspaceId || view.current.serverId || null, sourceId: view.current.sourceId || view.current.channelId || null } : null;
    return { workspaces: view.workspaces || view.servers || [], sourcesByWorkspace: view.sourcesByWorkspace || view.channelsByServer || {}, current, updatedAt: view.updatedAt || null };
  }
  globalThis.DCE.uiTranslator = { describe, navigation };
})();
