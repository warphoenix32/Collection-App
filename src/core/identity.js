(() => {
  const DCE = globalThis.DCE;
  function adapterMetadata() {
    try { const manifest = DCE.platformRuntime.manifest(); return { platform: manifest.platform, method: manifest.provenance?.acquisitionMethod || "observation" }; }
    catch (_) { return { platform: "unknown", method: "observation" }; }
  }

  const ROLE_SUFFIXES = [
    "Original Poster", "Council Member", "Battle Tested", "Star Atlas Team",
    "I'm new here, say hi!", "The Vantarah"
  ];
  const ROLE_SUFFIX_PATTERNS = [
    /\b[A-Z][A-Za-z0-9'’._ -]{1,40}\s+Ring holder\s*$/i
  ];

  function cleanName(value) {
    let name = String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    name = name.replace(/,?\s*Server Tag:.*$/i, "");
    for (const suffix of ROLE_SUFFIXES) {
      name = name.replace(new RegExp(`\\s*${suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "");
    }
    for (const pattern of ROLE_SUFFIX_PATTERNS) name = name.replace(pattern, "");
    return name.trim() || null;
  }

  function observationKey(author) {
    if (author?.userId) return `${adapterMetadata().platform}:${author.userId}`;
    const clean = cleanName(author?.displayName);
    if (clean) return `name:${clean.toLowerCase()}`;
    return "unknown";
  }

  function confidenceFor(author) {
    if (author?.userId && author?.displayName && !author?.inferred) return "high";
    if (author?.userId) return author?.inferred ? "medium" : "high";
    if (author?.displayName) return author?.inferred ? "low" : "medium";
    return "unknown";
  }

  function createRecord(author, index) {
    const adapter = adapterMetadata();
    const platformUserId = author?.userId || null;
    const displayName = cleanName(author?.displayName);
    return {
      participantId: platformUserId ? `${adapter.platform}-user-${platformUserId}` : `participant-${index}`,
      platform: adapter.platform,
      platformUserId,
      displayName,
      aliases: [],
      bot: null,
      confidence: confidenceFor(author),
      provenance: {
        displayName: displayName ? (author?.inferred ? `${adapter.platform}-${adapter.method}-inferred` : `${adapter.platform}-${adapter.method}`) : null,
        platformUserId: platformUserId ? "avatar-url" : null
      },
      observations: {
        direct: author?.inferred ? 0 : 1,
        inferred: author?.inferred ? 1 : 0,
        displayNames: displayName ? [displayName] : []
      }
    };
  }

  function mergeConfidence(current, incoming) {
    const rank = { unknown: 0, low: 1, medium: 2, high: 3 };
    return rank[incoming] > rank[current] ? incoming : current;
  }

  function observe(record, author) {
    const adapter = adapterMetadata();
    const name = cleanName(author?.displayName);
    if (author?.inferred) record.observations.inferred += 1;
    else record.observations.direct += 1;
    record.confidence = mergeConfidence(record.confidence, confidenceFor(author));

    if (name && !record.observations.displayNames.includes(name)) {
      record.observations.displayNames.push(name);
    }

    if (!record.displayName && name) {
      record.displayName = name;
      record.provenance.displayName = author?.inferred ? `${adapter.platform}-${adapter.method}-inferred` : `${adapter.platform}-${adapter.method}`;
    } else if (name && name !== record.displayName && !record.aliases.includes(name)) {
      record.aliases.push(name);
    }
  }

  function build(rawMessages) {
    const records = new Map();
    for (const message of rawMessages) {
      const key = observationKey(message.author);
      if (!records.has(key)) records.set(key, createRecord(message.author, records.size + 1));
      else observe(records.get(key), message.author);
    }
    return records;
  }

  function resolve(records, author) {
    return records.get(observationKey(author)) || null;
  }

  DCE.identity = { build, resolve, cleanName, observationKey };
})();
