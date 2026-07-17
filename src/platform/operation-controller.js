(() => {
  const DCE = globalThis.DCE;
  let active = null;

  function begin(kind) {
    if (active) throw new Error(`A ${active.kind} operation is already running.`);
    active = {
      id: DCE.sdk?.createJobId?.("operation") || `operation-${Date.now()}`,
      kind,
      startedAt: new Date().toISOString(),
      cancellationRequested: false,
      cancellationReason: null
    };
    return { ...active };
  }

  function requestCancellation(reason = "operator-requested") {
    if (!active) return { accepted: false, reason: "no-active-operation" };
    active.cancellationRequested = true;
    active.cancellationReason = reason;
    return { accepted: true, operation: { ...active } };
  }

  function isCancellationRequested() {
    return Boolean(active?.cancellationRequested);
  }

  function snapshot() {
    return active ? { ...active } : null;
  }

  function finish(id) {
    if (active && (!id || active.id === id)) active = null;
  }

  DCE.operationController = { begin, requestCancellation, isCancellationRequested, snapshot, finish };
})();
