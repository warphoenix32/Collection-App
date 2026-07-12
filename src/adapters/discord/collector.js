(() => {
  const DCE = globalThis.DCE;
  const S = DCE.discord.selectors;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let acquisitionBuffer = new Map();

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

  function rawMessageKey(message) {
    return message.messageId || `${message.timestamp}|${message.author?.userId || message.author?.displayName || ""}|${message.content || ""}`;
  }

  function parseRenderedMessages() {
    const messages = [];
    let currentAuthor = null;
    for (const element of document.querySelectorAll(S.message)) {
      const message = DCE.discord.parser.parseMessage(element, currentAuthor);
      if (!message.timestamp) continue;
      if (!message.system && !message.author.inferred && (message.author.displayName || message.author.userId)) {
        currentAuthor = { displayName: message.author.displayName, userId: message.author.userId };
      }
      messages.push(message);
    }
    return messages;
  }

  function accumulateRenderedMessages() {
    for (const message of parseRenderedMessages()) acquisitionBuffer.set(rawMessageKey(message), message);
    return acquisitionBuffer.size;
  }

  function bufferedTimeBounds() {
    const timestamps = Array.from(acquisitionBuffer.values())
      .map(message => Date.parse(message.timestamp)).filter(Number.isFinite);
    return {
      earliest: timestamps.length ? Math.min(...timestamps) : null,
      latest: timestamps.length ? Math.max(...timestamps) : null
    };
  }

  function getRenderedSnapshot() {
    const timestamps = Array.from(document.querySelectorAll(`${S.message} time[datetime]`))
      .map(node => Date.parse(node.getAttribute("datetime"))).filter(Number.isFinite);
    const bounds = bufferedTimeBounds();
    return {
      earliest: timestamps.length ? Math.min(...timestamps) : null,
      latest: timestamps.length ? Math.max(...timestamps) : null,
      earliestAcquired: bounds.earliest,
      latestAcquired: bounds.latest,
      renderedCount: document.querySelectorAll(S.message).length,
      bufferedCount: acquisitionBuffer.size,
      scrollHeight: getMessageScroller()?.scrollHeight || 0
    };
  }

  function snapshotAdvanced(before, after) {
    return after.earliest !== null && (
      before.earliest === null || after.earliest < before.earliest ||
      after.bufferedCount > before.bufferedCount || after.scrollHeight !== before.scrollHeight
    );
  }

  async function waitForProgress(before, timeoutMs) {
    const started = Date.now();
    let delay = DCE.config.loadOlderInitialDelayMs;
    while (Date.now() - started < timeoutMs) {
      await sleep(delay);
      accumulateRenderedMessages();
      const after = getRenderedSnapshot();
      if (snapshotAdvanced(before, after)) return { advanced: true, snapshot: after, waitedMs: Date.now() - started };
      delay = Math.min(Math.round(delay * 1.35), 1500);
    }
    return { advanced: false, snapshot: getRenderedSnapshot(), waitedMs: Date.now() - started };
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
      earliestAcquired: earliest ? new Date(earliest).toISOString() : null,
      latestAcquired: latest ? new Date(latest).toISOString() : null,
      confidence: startReached ? "high" : (earliest ? "medium" : "low")
    };
  }

  function resolveMaxRuntimeMs(requested) {
    const numeric = Number(requested);
    if (!Number.isFinite(numeric) || numeric <= 0) return DCE.config.acquisitionDefaultMaxRuntimeMs;
    return Math.min(
      Math.max(Math.round(numeric), DCE.config.acquisitionMinimumMaxRuntimeMs),
      DCE.config.acquisitionMaximumMaxRuntimeMs
    );
  }

  async function persistCheckpoint(report) {
    try {
      await chrome.storage.local.set({
        [DCE.config.acquisitionCheckpointKey]: {
          savedAt: new Date().toISOString(),
          url: location.href,
          cutoff: report.coverage?.requestedStart || null,
          earliestLoaded: report.earliestLoaded,
          bufferedMessages: acquisitionBuffer.size,
          elapsedMs: report.elapsedMs,
          maxRuntimeMs: report.maxRuntimeMs,
          cycles: report.cycles,
          recoveries: report.recoveries
        }
      });
    } catch (error) {
      DCE.logger.warn("acquisition.checkpoint.failed", { error: error.message });
    }
  }

  async function loadOlderMessagesUntil(startIso, policy = {}) {
    acquisitionBuffer = new Map();
    const maxRuntimeMs = resolveMaxRuntimeMs(policy.maxRuntimeMs);
    const startedAt = Date.now();
    const report = {
      attempted: true, complete: false, cycles: 0, recoveries: 0,
      stopReason: null, earliestLoaded: null, latestLoaded: null,
      messagesAccumulated: 0, warnings: [], coverage: null,
      startedAt: new Date(startedAt).toISOString(), elapsedMs: 0, maxRuntimeMs
    };
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
      return report;
    }

    accumulateRenderedMessages();
    let snapshot = getRenderedSnapshot();
    let consecutiveStalls = 0;

    while (true) {
      if (snapshot.earliestAcquired !== null && snapshot.earliestAcquired <= cutoff) {
        report.complete = true;
        report.stopReason = "cutoff-reached";
        break;
      }

      // Runtime is evaluated before beginning a new cycle. A cycle already in progress is always allowed to finish cleanly.
      if (Date.now() - startedAt >= maxRuntimeMs) {
        report.stopReason = "runtime-limit";
        report.warnings.push(`The historical acquisition runtime limit of ${Math.round(maxRuntimeMs / 60000)} minutes was reached before the requested start time.`);
        break;
      }

      report.cycles += 1;
      const before = snapshot;
      await scrollToOldest(scroller);
      const progress = await waitForProgress(before, DCE.config.loadOlderMaxWaitMs);
      snapshot = progress.snapshot;

      if (progress.advanced) {
        consecutiveStalls = 0;
      } else {
        consecutiveStalls += 1;
        DCE.logger.warn("acquisition.stall", { cycle: report.cycles, consecutiveStalls, earliest: snapshot.earliestAcquired, buffered: snapshot.bufferedCount });
        if (consecutiveStalls >= DCE.config.loadOlderSoftStallLimit) {
          await recoverFromStall(scroller, report.recoveries);
          report.recoveries += 1;
          consecutiveStalls = 0;
          accumulateRenderedMessages();
          snapshot = getRenderedSnapshot();
          DCE.logger.info("acquisition.recovery.executed", { recoveries: report.recoveries, earliest: snapshot.earliestAcquired, buffered: snapshot.bufferedCount });
        }
      }

      if (report.cycles % DCE.config.loadOlderProgressLogInterval === 0) {
        report.elapsedMs = Date.now() - startedAt;
        report.earliestLoaded = snapshot.earliestAcquired ? new Date(snapshot.earliestAcquired).toISOString() : null;
        report.latestLoaded = snapshot.latestAcquired ? new Date(snapshot.latestAcquired).toISOString() : null;
        report.messagesAccumulated = acquisitionBuffer.size;
        report.coverage = coverageFor(cutoff, snapshot.earliestAcquired, snapshot.latestAcquired);
        await persistCheckpoint(report);
        DCE.logger.info("acquisition.progress", {
          cycles: report.cycles,
          recoveries: report.recoveries,
          elapsedMs: report.elapsedMs,
          maxRuntimeMs,
          earliest: report.earliestLoaded,
          buffered: report.messagesAccumulated
        });
      }
    }

    accumulateRenderedMessages();
    snapshot = getRenderedSnapshot();
    report.elapsedMs = Date.now() - startedAt;
    report.finishedAt = new Date().toISOString();
    report.earliestLoaded = snapshot.earliestAcquired ? new Date(snapshot.earliestAcquired).toISOString() : null;
    report.latestLoaded = snapshot.latestAcquired ? new Date(snapshot.latestAcquired).toISOString() : null;
    report.messagesAccumulated = acquisitionBuffer.size;
    report.coverage = coverageFor(cutoff, snapshot.earliestAcquired, snapshot.latestAcquired);
    report.complete = report.coverage.startReached;
    await persistCheckpoint(report);
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

  function resetAcquisitionBuffer() { acquisitionBuffer = new Map(); }

  DCE.discord.collector = { loadOlderMessagesUntil, parseLoadedMessages, resetAcquisitionBuffer };
})();
