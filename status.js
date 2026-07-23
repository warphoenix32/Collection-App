const $ = id => document.getElementById(id);
const notice = $("notice");
let discordTabId = null;
let lastStatus = null;

async function findDiscordTab() {
  const tabs = await chrome.tabs.query({ url: "https://discord.com/*" });
  const tab = tabs.find(item => item.active) || tabs.at(-1);
  if (!tab?.id) throw new Error("Open Discord in Chrome to view or recover a collection.");
  discordTabId = tab.id;
  return tab;
}

async function send(action) {
  if (!discordTabId) await findDiscordTab();
  try {
    return await chrome.tabs.sendMessage(discordTabId, { action });
  } catch (error) {
    discordTabId = null;
    await findDiscordTab();
    return chrome.tabs.sendMessage(discordTabId, { action });
  }
}

function value(id, text) { $(id).textContent = text || "—"; }

function render(result) {
  lastStatus = result;
  const job = result.job || {};
  const checkpoint = result.checkpoint || {};
  const recoverable = Boolean(checkpoint.recoverable);
  value("jobStatus", job.status || (recoverable ? "recoverable" : "idle"));
  value("stage", [job.stage, job.stopReason || checkpoint.stopReason].filter(Boolean).join(" / "));
  value("messages", String(job.messagesAccumulated ?? checkpoint.bufferedMessages ?? 0));
  value("oldest", job.earliestCollected || checkpoint.earliestLoaded);
  value("newest", job.latestCollected || checkpoint.latestLoaded);
  value("progress", [job.lastProgressAt, job.checkpointSavedAt || checkpoint.savedAt].filter(Boolean).join("\n"));
  value("cycles", `${job.cycles ?? checkpoint.cycles ?? 0} / ${job.recoveries ?? checkpoint.recoveries ?? 0}`);
  const range = job.requestedRange || {};
  value("range", range.start || checkpoint.cutoff ? `${range.start || checkpoint.cutoff} → ${range.end || "open"}` : null);
  $("partial").disabled = !recoverable;
  $("resume").disabled = !recoverable;
  $("discard").disabled = !checkpoint.savedAt;
  notice.textContent = result.activeOperation
    ? `Active operation: ${result.activeOperation.kind}. This page refreshes automatically.`
    : (recoverable ? "An incomplete checkpoint is available. You can download it now or resume acquisition." : "No incomplete recovery checkpoint is available.");
}

async function refresh() {
  try {
    const result = await send("getCollectionStatus");
    if (!result?.success) throw new Error(result?.error || "Status request failed.");
    render(result);
  } catch (error) {
    notice.textContent = `Monitor unavailable:\n${error.message}`;
  }
}

async function action(name, workingText) {
  notice.textContent = workingText;
  const result = await send(name);
  if (!result?.success) throw new Error(result?.error || "Action failed.");
  return result;
}

$("refresh").addEventListener("click", refresh);
$("partial").addEventListener("click", async () => {
  try { const result = await action("downloadRecoveryCheckpoint", "Generating partial archival JSON…"); notice.textContent = `Partial archive downloaded: ${result.outputFilename}`; }
  catch (error) { notice.textContent = `Partial export failed:\n${error.message}`; }
});
$("resume").addEventListener("click", async () => {
  try { notice.textContent = "Resuming acquisition. Discord will begin loading older messages…"; await action("resumeRecoveryCheckpoint", notice.textContent); await refresh(); }
  catch (error) { notice.textContent = `Resume failed:\n${error.message}`; }
});
$("diagnostics").addEventListener("click", async () => {
  try { const result = await action("exportDiagnosticBundle", "Generating diagnostic bundle…"); notice.textContent = `Diagnostics downloaded: ${result.outputFilename}`; }
  catch (error) { notice.textContent = `Diagnostic export failed:\n${error.message}`; }
});
$("discard").addEventListener("click", async () => {
  if (!lastStatus?.checkpoint?.savedAt || !confirm("Discard the current recovery checkpoint? This cannot be undone.")) return;
  try { await action("discardRecoveryCheckpoint", "Discarding checkpoint…"); await refresh(); }
  catch (error) { notice.textContent = `Discard failed:\n${error.message}`; }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.collectionPlatformActiveJob) refresh();
});
setInterval(refresh, 5000);
refresh();
