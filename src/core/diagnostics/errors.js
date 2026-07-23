(() => {
  const DCE = globalThis.DCE;

  function classify(error, stage = "collection") {
    const message = String(error?.message || error || "Unknown collection failure.");
    const normalized = message.toLowerCase();
    let code = "unexpected";
    if (normalized.includes("scroller")) code = "no-scroller";
    else if (normalized.includes("navigation") || normalized.includes("render")) code = "navigation-timeout";
    else if (normalized.includes("storage") || normalized.includes("indexeddb") || normalized.includes("quota")) code = "storage-failure";
    else if (normalized.includes("message") && normalized.includes("matched")) code = "no-messages";
    else if (normalized.includes("runtime")) code = "runtime-limit";
    else if (normalized.includes("stall") || normalized.includes("progress")) code = "pagination-stalled";
    return {
      code,
      stage,
      message,
      retryable: code !== "no-messages",
      occurredAt: new Date().toISOString()
    };
  }

  DCE.errors = { classify };
})();
