const test = require("node:test");
const assert = require("node:assert/strict");
const { createContext, load } = require("./helpers");

function platformContext() {
  const context = createContext();
  load(context, "src/core/config.js");
  load(context, "src/core/sdk/conversation-sdk.js");
  load(context, "src/platform/operation-controller.js");
  load(context, "src/platform/runtime-policies.js");
  load(context, "src/platform/collection-intent.js");
  load(context, "src/platform/mission-profile.js");
  load(context, "src/platform/knowledge-object.js");
  load(context, "src/platform/adapter-registry.js");
  load(context, "src/platform/detection-engine.js");
  load(context, "src/platform/ui-translator.js");
  return context;
}

function adapter(id, confidence, platform = id) {
  return {
    manifest: {
      id,
      name: `${id} adapter`,
      version: "1.0.0",
      platform,
      capabilities: {},
      sources: [],
      entities: [],
      exports: [],
      runtimePolicies: [],
      ui: { labels: {}, operations: [] }
    },
    detect: () => confidence,
    createRuntime: () => ({})
  };
}

test("runtime policies clamp historical runtime to supported bounds", () => {
  const { DCE } = platformContext();
  assert.equal(DCE.runtimePolicies.resolve({ historicalRuntimeMs: 1 }).historicalRuntimeMs, DCE.config.acquisitionMinimumMaxRuntimeMs);
  assert.equal(DCE.runtimePolicies.resolve({ historicalRuntimeMs: Infinity }).historicalRuntimeMs, DCE.config.acquisitionDefaultMaxRuntimeMs);
  assert.equal(DCE.runtimePolicies.resolve({ historicalRuntimeMs: 99 * 60 * 60 * 1000 }).historicalRuntimeMs, DCE.config.acquisitionMaximumMaxRuntimeMs);
});

test("operation controller serializes work and accepts cancellation", () => {
  const { DCE } = platformContext();
  const active = DCE.operationController.begin("collection");
  assert.equal(DCE.operationController.snapshot().kind, "collection");
  assert.throws(() => DCE.operationController.begin("batch"), /already running/);
  assert.equal(DCE.operationController.requestCancellation().accepted, true);
  assert.equal(DCE.operationController.isCancellationRequested(), true);
  DCE.operationController.finish(active.id);
  assert.equal(DCE.operationController.snapshot(), null);
});

test("adapter detection selects the strongest sufficiently confident adapter", async () => {
  const { DCE } = platformContext();
  DCE.adapterRegistry.register(adapter("weak", 0.49));
  DCE.adapterRegistry.register(adapter("strong", 0.9));
  const result = await DCE.detectionEngine.detect({ hostname: "example.test" });
  assert.equal(result.winner.manifest.id, "strong");
  assert.equal(result.confidence, 0.9);
});

test("adapter detection rejects low-confidence ownership", async () => {
  const { DCE } = platformContext();
  DCE.adapterRegistry.register(adapter("weak", 0.2));
  await assert.rejects(() => DCE.detectionEngine.detect({ hostname: "unknown.test" }), /sufficient confidence/);
});

test("adapter registry rejects duplicate identifiers", () => {
  const { DCE } = platformContext();
  DCE.adapterRegistry.register(adapter("same", 1));
  assert.throws(() => DCE.adapterRegistry.register(adapter("same", 1)), /already registered/);
});

test("platform runtime rejects a selected adapter that violates the contract", async () => {
  const context = createContext();
  const { DCE } = context;
  DCE.logger = { info() {} };
  DCE.config = { platformVersion: "4.0.1" };
  DCE.uiTranslator = { describe: manifest => manifest };
  DCE.contracts = {
    adapter: {
      validate: runtime => ({ valid: Boolean(runtime?.collector?.parse), missing: ["collector.parse"] })
    }
  };
  DCE.detectionEngine = {
    detect: async () => ({
      confidence: 1,
      winner: {
        manifest: { id: "broken", platform: "test" },
        createRuntime: () => ({ navigation: {} })
      }
    })
  };
  load(context, "src/platform/platform-runtime.js");
  await assert.rejects(
    () => DCE.platformRuntime.initialize({ context: () => ({ hostname: "example.test" }) }),
    /does not satisfy the platform contract/
  );
  assert.throws(() => DCE.platformRuntime.requireAdapter(), /not initialized/);
});

test("collection intents and knowledge objects validate canonical inputs", () => {
  const { DCE } = platformContext();
  assert.equal(DCE.collectionIntent.normalize("Incident Response").id, "incident-response");
  assert.throws(() => DCE.collectionIntent.normalize("anything"), /Unsupported/);
  assert.throws(() => DCE.knowledgeObject.create({}), /requires identity.id/);
  const object = DCE.knowledgeObject.create({ identity: { id: "post-1" }, source: { original: "https://example.test/post/1" } });
  assert.equal(object.schemaVersion, "1.0.0");
  assert.equal(object.identity.id, "post-1");
});

test("failed historical acquisition reports partial low-confidence coverage", () => {
  const context = createContext();
  const { DCE } = context;
  load(context, "src/core/config.js");
  load(context, "src/platform/runtime-policies.js");
  load(context, "src/platform/collection-intent.js");
  load(context, "src/core/identity.js");
  DCE.platformRuntime = {
    manifest: () => ({ id: "test", name: "Test Adapter", version: "1.0.0", platform: "test" })
  };
  load(context, "src/core/conversation-model.js");
  const model = DCE.conversationModel.buildConversation({
    rawMessages: [{
      messageId: "1",
      timestamp: "2026-07-16T12:00:00.000Z",
      author: { displayName: "Operator", userId: "1", inferred: false },
      content: "Observed message",
      attachments: []
    }],
    source: {
      platform: "test",
      type: "timeline",
      acquisitionStrategy: "current",
      url: "https://example.test/timeline",
      workspace: null,
      conversation: { id: "timeline", name: "Timeline" }
    },
    options: { intent: "archival", startIso: "2026-07-01T00:00:00.000Z" },
    collectionReport: { attempted: true, complete: false, stopReason: "no-scroller", warnings: ["No scroller"] },
    startedAt: Date.parse("2026-07-16T12:00:00.000Z"),
    finishedAt: Date.parse("2026-07-16T12:00:01.000Z")
  });
  assert.equal(model.collection.coverage.status, "partial");
  assert.equal(model.collection.coverage.startReached, false);
  assert.equal(model.collection.coverage.confidence, "low");
});

test("mission execution preserves top-level intent and runtime policy", () => {
  const { DCE } = platformContext();
  const options = DCE.missionProfile.executionOptions({
    intent: { id: "monitoring" },
    runtimePolicy: { historicalRuntimeMs: 6 * 60 * 60 * 1000 },
    options: { format: "json", intent: "archival" }
  }, { format: "markdown", maxRuntimeMs: 60 * 60 * 1000 });
  assert.equal(options.intent, "monitoring");
  assert.equal(options.runtimePolicy.historicalRuntimeMs, 6 * 60 * 60 * 1000);
  assert.equal(options.maxRuntimeMs, 6 * 60 * 60 * 1000);
  assert.equal(options.format, "json");
});

test("cancelled batches skip remaining targets and still restore the original view", async () => {
  const context = platformContext();
  const { DCE } = context;
  context.location = { href: "https://example.test/original" };
  DCE.logger = { info() {}, warn() {}, error() {}, snapshot: () => [] };
  DCE.exporter = { downloadPayload() {} };
  DCE.platformRuntime = {
    requireAdapter: () => ({
      manifest: { id: "test", version: "1.0.0", platform: "test", provenance: {} },
      navigation: { navigate: async url => { context.location.href = url; } }
    })
  };
  load(context, "src/core/orchestration/batch.js");
  const operation = DCE.operationController.begin("batch");
  DCE.operationController.requestCancellation();
  const result = await DCE.batch.execute({
    targets: [{ platform: "test", conversationId: "1" }, { platform: "test", conversationId: "2" }],
    options: { intent: { id: "archival" } }
  }, async () => { throw new Error("cancelled targets must not execute"); });
  assert.equal(result.success, false);
  assert.equal(result.manifest.cancelled, true);
  assert.equal(result.manifest.totals.cancelled, 2);
  assert.equal(result.manifest.results.every(item => item.status === "cancelled"), true);
  assert.equal(result.manifest.restored, true);
  DCE.operationController.finish(operation.id);
});

test("batches with any failed target report overall failure", async () => {
  const context = platformContext();
  const { DCE } = context;
  context.location = { href: "https://example.test/original" };
  DCE.logger = { info() {}, warn() {}, error() {}, snapshot: () => [] };
  DCE.exporter = { downloadPayload() {} };
  DCE.platformRuntime = {
    requireAdapter: () => ({
      manifest: { id: "test", version: "1.0.0", platform: "test", provenance: {} },
      navigation: { navigate: async url => { context.location.href = url; } }
    })
  };
  DCE.config = Object.freeze({ ...DCE.config, batchItemRetryCount: 0 });
  load(context, "src/core/orchestration/batch.js");
  const result = await DCE.batch.execute({
    targets: [{ platform: "test", conversationId: "1" }, { platform: "test", conversationId: "2" }],
    options: { intent: { id: "archival" } }
  }, async request => request.target.conversationId === "1"
    ? { success: true, count: 1, participantCount: 1, collectionComplete: true }
    : { success: false, error: "expected test failure" });
  assert.equal(result.manifest.totals.success, 1);
  assert.equal(result.manifest.totals.failed, 1);
  assert.equal(result.success, false);
});

test("UI translation preserves canonical navigation while exposing native labels", () => {
  const { DCE } = platformContext();
  const translated = DCE.uiTranslator.navigation({
    servers: [{ id: "workspace-1", name: "Workspace" }],
    channelsByServer: { "workspace-1": [{ id: "source-1", name: "Source" }] },
    current: { serverId: "workspace-1", channelId: "source-1" }
  });
  assert.equal(translated.current.workspaceId, "workspace-1");
  assert.equal(translated.current.sourceId, "source-1");
  assert.equal(translated.workspaces.length, 1);
});
