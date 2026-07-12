(() => {
  const DCE = globalThis.DCE;
  const selectors = DCE.discord.selectors;

  function guildIdFromTreeItem(treeItem) {
    const raw = treeItem.getAttribute("data-list-item-id") || "";
    const match = raw.match(/^guildsnav___(\d+)$/);
    return match ? match[1] : null;
  }

  function guildNameFromTreeItem(treeItem, guildId) {
    const owner = treeItem.closest("[data-dnd-name]");
    const hiddenText = treeItem.querySelector("span")?.textContent || "";
    const candidates = [owner?.getAttribute("data-dnd-name"), treeItem.getAttribute("aria-label"), hiddenText];

    for (const candidate of candidates) {
      let value = candidate?.replace(/\s+/g, " ").trim();
      if (!value) continue;
      value = value
        .replace(/^Unread messages,\s*/i, "")
        .replace(/^\d+\s+mentions?,\s*/i, "")
        .replace(/,\s*Screenshare active.*$/i, "")
        .replace(/,\s*Voice call active.*$/i, "")
        .trim();
      if (value) return value;
    }
    return `Server ${guildId}`;
  }

  function scanServers() {
    const servers = new Map();
    for (const treeItem of document.querySelectorAll(selectors.serverTreeItem)) {
      const id = guildIdFromTreeItem(treeItem);
      if (!id) continue;
      servers.set(id, {
        id,
        name: guildNameFromTreeItem(treeItem, id),
        url: `https://discord.com/channels/${id}`,
        selected: treeItem.getAttribute("aria-selected") === "true",
        position: Number(treeItem.getAttribute("aria-posinset")) || null
      });
    }
    return Array.from(servers.values()).sort((a, b) => {
      if (a.position && b.position) return a.position - b.position;
      return a.name.localeCompare(b.name);
    });
  }

  function scanChannels(serverId) {
    const channels = new Map();
    for (const anchor of document.querySelectorAll(selectors.channelAnchor)) {
      const href = anchor.getAttribute("href") || "";
      const hrefMatch = href.match(/^\/channels\/(\d+)\/(\d+)$/);
      if (!hrefMatch || hrefMatch[1] !== serverId) continue;
      const aria = anchor.getAttribute("aria-label") || "";
      if (/\(voice channel\)/i.test(aria) || /\(category\)/i.test(aria)) continue;
      const rawId = anchor.getAttribute("data-list-item-id") || "";
      const idMatch = rawId.match(/^channels___(\d+)$/);
      if (!idMatch) continue;
      const id = idMatch[1];
      const row = anchor.closest("li");
      let name = row?.getAttribute("data-dnd-name") || anchor.querySelector('[class*="name"]')?.textContent || aria || `Channel ${id}`;
      name = name
        .replace(/^unread,\s*/i, "")
        .replace(/\s+\((?:text|announcement|forum) channel\).*$/i, "")
        .replace(/\s*,?\s*Private Channel.*$/i, "")
        .trim();
      channels.set(id, { id, name, url: `https://discord.com/channels/${serverId}/${id}` });
    }
    return Array.from(channels.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  DCE.discord.discovery = { scanServers, scanChannels };
})();
