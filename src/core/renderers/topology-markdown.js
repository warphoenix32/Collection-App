(() => {
  function cell(value) { return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " "); }
  function yes(value) { return value ? "yes" : "no"; }
  globalThis.DCE.renderers.topologyMarkdown = topology => {
    const lines = [
      `# Server Topology: ${topology.server.name || topology.server.id}`,
      "", `- Platform: ${topology.platform}`, `- Server ID: ${topology.server.id}`,
      `- Observed: ${topology.observedAt || topology.generatedAt}`, `- Source: ${topology.sourceUrl || "unavailable"}`,
      "", "## Coverage", "",
      `- Categories: ${topology.statistics.categories}`, `- Channels: ${topology.statistics.channels}`,
      `- Threads: ${topology.statistics.threads}`, `- Forums: ${topology.statistics.forums}`,
      `- Collectible: ${topology.statistics.collectible}`, `- Known unreadable: ${topology.statistics.knownUnreadable}`,
      "", "## Categories", "", "| Position | ID | Name | Collapsed |", "|---:|---|---|---|"
    ];
    for (const item of topology.categories) lines.push(`| ${cell(item.position)} | ${cell(item.id)} | ${cell(item.name)} | ${item.collapsed === null ? "unknown" : yes(item.collapsed)} |`);
    lines.push("", "## Channels", "", "| Position | ID | Name | Type | Category | State | Navigate | Collect |", "|---:|---|---|---|---|---|---|---|");
    for (const item of topology.channels) lines.push(`| ${cell(item.position)} | ${cell(item.id)} | ${cell(item.name)} | ${cell(item.type)} | ${cell(item.categoryId)} | ${item.visibilityState} | ${yes(item.canNavigate)} | ${yes(item.canCollect)} |`);
    lines.push("", "## Threads", "", "| ID | Name | Parent | Archived | Locked | State |", "|---|---|---|---|---|---|");
    for (const item of topology.threads) lines.push(`| ${cell(item.id)} | ${cell(item.name)} | ${cell(item.parentId)} | ${item.archived ?? "unknown"} | ${item.locked ?? "unknown"} | ${item.visibilityState} |`);
    lines.push("", "## Forums", "", "| ID | Name | Parent Category | State |", "|---|---|---|---|");
    for (const item of topology.forums) lines.push(`| ${cell(item.id)} | ${cell(item.name)} | ${cell(item.parentCategory)} | ${item.visibilityState} |`);
    lines.push("");
    return lines.join("\n");
  };
})();
