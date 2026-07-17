(() => {
  const DCE = globalThis.DCE;
  const S = DCE.discord.selectors;

  function exposedId(node) {
    const values = [node?.getAttribute?.("data-list-item-id"), node?.getAttribute?.("data-channel-id"), node?.id];
    for (const value of values) {
      const match = String(value || "").match(/(?:channels___|channel-|category-|^)(\d{6,})$/);
      if (match) return match[1];
    }
    return null;
  }

  function cleanName(value) {
    return DCE.sdk.normalizeWhitespace(value)
      .replace(/^unread,\s*/i, "")
      .replace(/\s+\((?:text|announcement|forum|voice|stage|thread) channel\).*$/i, "")
      .replace(/,?\s*(?:collapsed|expanded|muted|private channel).*$/i, "")
      .trim() || null;
  }

  function exposedName(node) {
    const candidates = [
      node?.getAttribute?.("data-dnd-name"), node?.getAttribute?.("aria-label"), node?.getAttribute?.("title"),
      node?.querySelector?.('[class*="name"], [class*="channelName"], [class*="overflow"]')?.textContent,
      node?.textContent
    ];
    return candidates.map(cleanName).find(Boolean) || null;
  }

  function classifyType(node, anchor) {
    const evidence = [node, anchor, node?.closest?.("li")].filter(Boolean)
      .flatMap(item => [item.getAttribute?.("aria-label"), item.getAttribute?.("data-list-item-id"), item.getAttribute?.("class"), item.getAttribute?.("data-channel-type")])
      .filter(Boolean).join(" ").toLowerCase();
    if (/thread/.test(evidence)) return "thread";
    if (/forum/.test(evidence)) return "forum";
    if (/announcement|news/.test(evidence)) return "announcement";
    if (/stage/.test(evidence)) return "stage";
    if (/voice/.test(evidence)) return "voice";
    if (/text/.test(evidence)) return "text";
    return "unknown";
  }

  function booleanMetadata(node, name, pattern) {
    const value = node?.getAttribute?.(`data-${name}`);
    if (value === "true") return true;
    if (value === "false") return false;
    const label = node?.getAttribute?.("aria-label") || "";
    return pattern.test(label) ? true : null;
  }

  function discoverServerTopology() {
    const locationIds = DCE.discord.navigation.currentLocationIds();
    if (!locationIds?.serverId || locationIds.isDirect) throw new Error("Open a Discord server before exporting its topology.");
    const serverRecord = DCE.discord.discovery.scanServers().find(server => server.id === locationIds.serverId);
    const server = { id: locationIds.serverId, name: serverRecord?.name || null };
    const categories = [], channels = [], seenCategories = new Set(), seenChannels = new Set();
    let activeCategoryId = null;
    let position = 0;
    const nodes = document.querySelectorAll(`${S.categoryToggle}, ${S.topologyNode}`);

    for (const node of nodes) {
      position += 1;
      const anchor = node.matches?.("a[href]") ? node : node.querySelector?.("a[href]");
      const href = anchor?.getAttribute?.("href") || "";
      const hrefMatch = href.match(/^\/channels\/(\d+)\/(\d+)(?:\/(\d+))?/);
      const looksLikeCategory = node.matches?.(S.categoryToggle) && !hrefMatch;
      if (looksLikeCategory) {
        const id = exposedId(node);
        const name = exposedName(node);
        if (!id && !name) continue;
        const key = id || `name:${name}`;
        if (seenCategories.has(key)) { if (id) activeCategoryId = id; continue; }
        seenCategories.add(key);
        categories.push({ id, name, position, collapsed: node.getAttribute("aria-expanded") === "false" });
        activeCategoryId = id;
        continue;
      }

      const id = hrefMatch?.[3] || hrefMatch?.[2] || exposedId(node);
      if (!id || seenChannels.has(id)) continue;
      seenChannels.add(id);
      const type = classifyType(node, anchor);
      const disabled = node.getAttribute?.("aria-disabled") === "true" || anchor?.getAttribute?.("aria-disabled") === "true";
      const canNavigate = Boolean(hrefMatch && hrefMatch[1] === locationIds.serverId && !disabled);
      const canCollect = canNavigate && !["voice", "stage", "unknown"].includes(type);
      const parentId = hrefMatch?.[3] ? hrefMatch[2] : (node.getAttribute?.("data-parent-channel-id") || null);
      channels.push({
        id, name: exposedName(node), type, categoryId: activeCategoryId, position,
        topic: node.getAttribute?.("aria-description") || node.getAttribute?.("data-topic") || null,
        visibilityState: canCollect ? "collectible" : "known-unreadable",
        collectible: canCollect, canNavigate, canCollect,
        parentId, archived: type === "thread" ? booleanMetadata(node, "archived", /\barchived\b/i) : null,
        locked: type === "thread" ? booleanMetadata(node, "locked", /\blocked\b/i) : null
      });
    }

    DCE.logger.info("topology.discovery.completed", { serverId: server.id, categories: categories.length, channels: channels.length });
    return { platform: "discord", server, categories, channels, observedAt: new Date().toISOString(), sourceUrl: location.href };
  }

  DCE.discord.topology = { discoverServerTopology };
})();
