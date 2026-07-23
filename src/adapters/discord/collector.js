(() => {
  const DCE = globalThis.DCE;
  const S = DCE.discord.selectors;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let acquisitionBuffer = new Map();
  let parsedElements = new WeakMap();
  let earliestBuffered = null;
  let latestBuffered = null;
  let lastReport = null;

  function checkpointMatches(checkpoint, startIso) {
    if (!checkpoint || ![2, 3].includes(checkpoint.version) || checkpoint.complete) return false;
    if (checkpoint.cutoff !== startIso) return false;
    try { return DCE.discord.navigation.canonicalConversationUrl(checkpoint.url) === DCE.discord.navigation.canonicalConversationUrl(location.href); }
    catch (_) { return checkpoint.url === location.href; }
  }

  function rawMessageKey(message) {
    return message.messageId || `${message.timestamp}|${message.author?.userId || message.author?.displayName || ""}|${message.content || ""}`;
  }

  function addToBuffer(message) {
    acquisitionBuffer.set(rawMessageKey(message), message);
    const timestamp = Date.parse(message.timestamp);
    if (Number.isFinite(timestamp)) {
      earliestBuffered = earliestBuffered === null ? timestamp : Math.min(earliestBuffered, timestamp);
      latestBuffered = latestBuffered === null ? timestamp : Math.max(latestBuffered, timestamp);
    }
  }

  function rebuildBounds() {
    earliestBuffered = null;
    latestBuffered = null;
    for (const message of acquisitionBuffer.values()) {
      const timestamp = Date.parse(message.timestamp);
      if (!Number.isFinite(timestamp)) continue;
      earliestBuffered = earliestBuffered === null ? timestamp : Math.min(earliestBuffered, timestamp);
      latestBuffered = latestBuffered === null ? timestamp : Math.max(latestBuffered, timestamp);
    }
  }

  async function restoreCheckpoint(startIso) {
    try {
      const checkpoint = await DCE.cache.readAcquisitionCheckpoint();
      if (!checkpointMatches(checkpoint, startIso) || !Array.isArray(checkpoint.messages)) return null;
      acquisitionBuffer = new Map(checkpoint.messages.map(message => [rawMessageKey(message), message]));
      rebuildBounds();
      DCE.logger.info("acquisition.checkpoint.restored", { savedAt: checkpoint.savedAt, bufferedMessages: acquisitionBuffer.size, cycles: checkpoint.cycles });
      return checkpoint;
    } catch (error) {
      DCE.logger.warn("acquisition.checkpoint.restore.failed", { error: error.message });
      return null;
    }
  }

  function getMessageScroller() {
    const message = document.querySelector(S.message);
    if (!message) return null;
    let node = message.parentElement;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) return node;
      node = node.parentElement;
    }
    return null;
  }

  function parseRenderedMessages() {
    const messages = [];
    let currentAuthor = null;
    for (const element of document.querySelectorAll(S.message)) {
      let message = parsedElements.get(element);
      if (!message) {
        message = DCE.discord.parser.parseMessage(element, currentAuthor);
        parsedElements.set(element, message);
      }
      if (!message.timestamp) continue;
      if (!message.system && !message.author.inferred && (message.author.displayName || message.author.userId)) {
        currentAuthor = { displayName: message.author.displayName, userId: message.author.userId };
      }
      messages.push(message);
    }
    return messages;
  }

  function accumulateRenderedMessages() {
    for (const message of parseRenderedMessages()) addToBuffer(message);
    return acquisitionBuffer.size;
  }

  function getRenderedSnapshot() {
    const timestamps = Array.from(document.querySelectorAll(`${S.message} time[datetime]`))
      .map(node => Date.parse(node.getAttribute("datetime"))).filter(Number.isFinite);
    return {
      earliest: timestamps.length ? timestamps.reduce((value, timestamp) => Math.min(value, timestamp), Infinity) : null,
      latest: timestamps.length ? timestamps.reduce((value, timestamp) => Math.max(value, timestamp), -Infinity) : null,
      earliestAcquired: earliestBuffered,
      latestAcquired: latestBuffered,
      renderedCount: document.querySelectorAll(S.message).length,
      bufferedCount: acquisitionBuffer.size,
      scrollHeight: getMessageScroller()?.scrollHeight || 0
    };
  }

  function snapshotAdvanced(before, after) {
    return Number.isFinite(after.earliest) && (
      !Number.isFinite(before.earliest) || after.earliest < before.earliest ||
      after.bufferedCount > before.bufferedCount || after.scrollHeight !== before.scrollHeight
    );
  }

  async function waitForProgress(before, timeoutMs, scroller) {
    const started = Date.now();
    let activeMs = 0;
    let wake = null;
    let observer = null;
    if (typeof MutationObserver !== "undefined" && scroller) {
      observer = new MutationObserver(() => wake?.());
      observer.observe(scroller, { childList: true, subtree: true });
    }
    try {
      while (Date.now() - started < timeoutMs) {
        const remaining = timeoutMs - (Date.now() - started);
        await new Promise(resolve => {
          const timer = setTimeout(resolve, Math.min(1500, Math.max(1, remaining)));
          wake = () => { clearTimeout(timer); resolve(); };
        });
        const activeStarted = Date.now();
        accumulateRenderedMessages();
        const after = getRenderedSnapshot();
        activeMs += Date.now() - activeStarted;
        if (snapshotAdvanced(before, after)) return { advanced: true, snapshot: after, waitedMs: Date.now() - started, activeMs };
      }
      const activeStarted = Date.now();
      const snapshot = getRenderedSnapshot();
      activeMs += Date.now() - activeStarted;
      return { advanced: false, snapshot, waitedMs: Date.now() - started, activeMs };
    } finally {
      observer?.disconnect();
      wake = null;
    }
  }

  async function scrollToOldest(scroller) {
    scroller.focus?.({ preventScroll: true });
    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event("scroll", { bubbles: true }));
  }

  async function recoverFromStall(scroller, recoveryIndex) {
    const modes = [
      async () => { scroller.scrollTop = Math.min(32, scroller.scrollHeight); scroller.dispatchEvent(new Event("scroll", { bubbles: true })); await sleep(250); await scrollToOldest(scroller); },
      async () => { scroller.dispatchEvent(new WheelEvent("wheel", { deltaY: -1800, bubbles: true, cancelable: true })); },
      async () => { scroller.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", code: "Home", bubbles: true })); },
      async () => { scroller.dispatchEvent(new KeyboardEvent("keydown", { key: "PageUp", code: "PageUp", bubbles: true })); },
      async () => { window.dispatchEvent(new Event("focus")); scroller.click?.(); await scrollToOldest(scroller); }
    ];
    await modes[recoveryIndex % modes.length]();
    await sleep(500 + Math.min((recoveryIndex % modes.length) * 250, 1500));
  }

  function coverageFor(cutoff, earliest, latest) {
    const startReached = earliest !== null && earliest <= cutoff;
    return {
      status: startReached ? "complete" : "partial",
      startReached,
      requestedStart: Number.isFinite(cutoff) ? new Date(cutoff).toISOString() : null,
      earliestAcquired: earliest !== null ? new Date(earliest).toISOString() : null,
      latestAcquired: latest !== null ? new Date(latest).toISOString() : null,
      confidence: startReached ? "high" : (earliest !== null ? "medium" : "low")
    };
  }

  function resolveMaxRuntimeMs(requested) {
    const numeric = Number(requested);
    if (!Number.isFinite(numeric) || numeric <= 0) return DCE.config.acquisitionDefaultMaxRuntimeMs;
    return Math.min(Math.max(Math.round(numeric), DCE.config.acquisitionMinimumMaxRuntimeMs), DCE.config.acquisitionMaximumMaxRuntimeMs);
  }

  function updateReport(report, snapshot, cutoff, startedAt) {
    report.elapsedMs = Date.now() - startedAt;
    report.earliestLoaded = snapshot.earliestAcquired !== null ? new Date(snapshot.earliestAcquired).toISOString() : null;
    report.latestLoaded = snapshot.latestAcquired !== null ? new Date(snapshot.latestAcquired).toISOString() : null;
    report.messagesAccumulated = acquisitionBuffer.size;
    report.coverage = coverageFor(cutoff, snapshot.earliestAcquired, snapshot.latestAcquired);
    lastReport = report;
    DCE.jobState?.update?.({
      status: "running",
      stage: "loading-history",
      cycles: report.cycles,
      recoveries: report.recoveries,
      activeRuntimeMs: report.activeRuntimeMs,
      elapsedMs: report.elapsedMs,
      messagesAccumulated: report.messagesAccumulated,
      earliestCollected: report.earliestLoaded,
      latestCollected: report.latestLoaded,
      lastProgressAt: report.lastProgressAt
    }).catch(() => {});
  }

  async function persistCheckpoint(report, policy = {}) {
    try {
      await DCE.cache.writeAcquisitionCheckpoint({
        version: 3,
        savedAt: new Date().toISOString(),
        url: location.href,
        cutoff: report.coverage?.requestedStart || null,
        earliestLoaded: report.earliestLoaded,
        latestLoaded: report.latestLoaded,
        bufferedMessages: acquisitionBuffer.size,
        elapsedMs: report.elapsedMs,
        activeRuntimeMs: report.activeRuntimeMs,
        maxRuntimeMs: report.maxRuntimeMs,
        cycles: report.cycles,
        recoveries: report.recoveries,
        complete: report.complete,
        stopReason: report.stopReason,
        source: policy.source || null,
        options: policy.options || null,
        jobId: policy.jobId || null,
        messages: Array.from(acquisitionBuffer.values())
      });
      await DCE.jobState?.update?.({ checkpointSavedAt: new Date().toISOString(), recoveryAvailable: !report.complete });
    } catch (error) {
      DCE.logger.warn("acquisition.checkpoint.failed", { error: error.message });
    }
  }

  async function loadOlderMessagesUntil(startIso, policy = {}) {
    acquisitionBuffer = new Map();
    parsedElements = new WeakMap();
    earliestBuffered = null;
    latestBuffered = null;
    const resumed = await restoreCheckpoint(startIso);
    const maxRuntimeMs = resolveMaxRuntimeMs(policy.maxRuntimeMs);
    const startedAt = Date.now();
    let activeRuntimeMs = Number(resumed?.activeRuntimeMs) || 0;
    let lastProgressAt = Date.now();
    const report = {
      attempted: true, complete: false, cycles: Number(resumed?.cycles) || 0, recoveries: Number(resumed?.recoveries) || 0,
      stopReason: null, earliestLoaded: null, latestLoaded: null,
      messagesAccumulated: acquisitionBuffer.size, warnings: [], coverage: null,
      startedAt: new Date(startedAt).toISOString(), elapsedMs: 0, activeRuntimeMs, maxRuntimeMs,
      resumed: Boolean(resumed), resumedFrom: resumed?.savedAt || null, lastProgressAt: new Date(lastProgressAt).toISOString()
    };
    lastReport = report;
    const cutoff = Date.parse(startIso);
    const scroller = getMessageScroller();
    if (!Number.isFinite(cutoff)) {
      report.stopReason = "invalid-cutoff";
      report.warnings.push("The requested start time was invalid.");
      return report;
    }
    if (!scroller) {
      report.stopReason = "no-scroller";
      report.warnings.push("Could not identify the conversation scroller; historical coverage is unknown.");
      report.coverage = coverageFor(cutoff, earliestBuffered, latestBuffered);
      await persistCheckpoint(report, policy);
      return report;
    }

    accumulateRenderedMessages();
    let snapshot = getRenderedSnapshot();
    let consecutiveStalls = 0;
    try {
      while (true) {
        if (snapshot.earliestAcquired !== null && snapshot.earliestAcquired <= cutoff) {
          report.complete = true;
          report.stopReason = "cutoff-reached";
          break;
        }
        if (activeRuntimeMs >= maxRuntimeMs) {
          report.stopReason = "runtime-limit";
          report.warnings.push(`The active historical acquisition runtime limit of ${Math.round(maxRuntimeMs / 60000)} minutes was reached. Waiting for Discord pagination was excluded.`);
          break;
        }
        if (Date.now() - lastProgressAt >= (DCE.config.loadOlderNoProgressLimitMs || 30 * 60 * 1000)) {
          report.stopReason = "no-progress-limit";
          report.warnings.push("Discord produced no older messages within the no-progress safety window. The partial archive is recoverable.");
          break;
        }

        report.cycles += 1;
        const before = snapshot;
        let activeStarted = Date.now();
        await scrollToOldest(scroller);
        activeRuntimeMs += Date.now() - activeStarted;
        const progress = await waitForProgress(before, DCE.config.loadOlderMaxWaitMs, scroller);
        activeRuntimeMs += progress.activeMs || 0;
        snapshot = progress.snapshot;

        if (progress.advanced) {
          consecutiveStalls = 0;
          lastProgressAt = Date.now();
        } else {
          consecutiveStalls += 1;
          DCE.logger.warn("acquisition.stall", { cycle: report.cycles, consecutiveStalls, waitedMs: progress.waitedMs, earliest: snapshot.earliestAcquired, buffered: snapshot.bufferedCount });
          if (consecutiveStalls >= DCE.config.loadOlderSoftStallLimit) {
            activeStarted = Date.now();
            await recoverFromStall(scroller, report.recoveries);
            activeRuntimeMs += Date.now() - activeStarted;
            report.recoveries += 1;
            consecutiveStalls = 0;
            accumulateRenderedMessages();
            snapshot = getRenderedSnapshot();
            DCE.logger.info("acquisition.recovery.executed", { recoveries: report.recoveries, earliest: snapshot.earliestAcquired, buffered: snapshot.bufferedCount });
          }
        }

        report.activeRuntimeMs = activeRuntimeMs;
        report.lastProgressAt = new Date(lastProgressAt).toISOString();
        updateReport(report, snapshot, cutoff, startedAt);
        if (report.cycles % (DCE.config.checkpointEveryCycles || DCE.config.loadOlderProgressLogInterval) === 0) {
          await persistCheckpoint(report, policy);
          DCE.logger.info("acquisition.progress", {
            cycles: report.cycles, recoveries: report.recoveries, elapsedMs: report.elapsedMs,
            activeRuntimeMs, maxRuntimeMs, earliest: report.earliestLoaded, buffered: report.messagesAccumulated
          });
        }
      }
    } catch (error) {
      report.stopReason = "exception";
      report.failure = DCE.errors?.classify?.(error, "historical-pagination") || { code: "unexpected", message: error.message };
      report.warnings.push(`Historical pagination failed: ${error.message}. A partial archive remains available.`);
      DCE.logger.error("acquisition.exception", report.failure);
    }

    accumulateRenderedMessages();
    snapshot = getRenderedSnapshot();
    report.activeRuntimeMs = activeRuntimeMs;
    report.lastProgressAt = new Date(lastProgressAt).toISOString();
    updateReport(report, snapshot, cutoff, startedAt);
    report.finishedAt = new Date().toISOString();
    report.complete = report.coverage.startReached;
    await persistCheckpoint(report, policy);
    return report;
  }

  function parseLoadedMessages() {
    accumulateRenderedMessages();
    const source = acquisitionBuffer.size ? Array.from(acquisitionBuffer.values()) : parseRenderedMessages();
    const unique = [], seen = new Set();
    for (const message of source) {
      const key = rawMessageKey(message);
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(message);
    }
    return unique.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }

  function getAcquisitionState() {
    return {
      report: lastReport,
      messages: Array.from(acquisitionBuffer.values()),
      earliestCollected: earliestBuffered !== null ? new Date(earliestBuffered).toISOString() : null,
      latestCollected: latestBuffered !== null ? new Date(latestBuffered).toISOString() : null
    };
  }

  function resetAcquisitionBuffer() {
    acquisitionBuffer = new Map();
    parsedElements = new WeakMap();
    earliestBuffered = null;
    latestBuffered = null;
    lastReport = null;
  }

  DCE.discord.collector = { loadOlderMessagesUntil, parseLoadedMessages, resetAcquisitionBuffer, getAcquisitionState };
})();
