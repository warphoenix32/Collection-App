const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');

function setup(overrides = {}) {
  let listener;
  let activeOperation = null;
  const chrome = { runtime: { onMessage: { addListener(fn) { listener = fn; } } } };
  const DCE = {
    config: { extensionVersion: 'test' },
    acquisition: { acquire: async () => ({ strategy: 'navigate', originalUrl: '/original', source: {} }), restore: async () => true },
    exporter: { exportConversation: async () => ({ success: false, error: 'no messages' }) },
    discord: { discovery: {}, collector: {}, navigation: { updateNavigationCache: async () => {}, startNavigationObserver() {}, describeCurrentConversation() {} } },
    batch: { execute: async () => ({ success: true }) }, profiles: {},
    contracts: { adapter: { validate: () => ({ valid: true }), capabilities: () => ({}) } },
    logger: { info() {}, warn() {}, error() {}, snapshot: () => [] },
    validation: { runtimeReport: () => ({}) }, ...overrides
  };
  DCE.operationController = {
    begin(kind) {
      if (activeOperation) throw new Error('operation already active');
      activeOperation = { id: 'test-operation', kind };
      return activeOperation;
    },
    finish(id) {
      if (activeOperation?.id === id) activeOperation = null;
    },
    snapshot() {
      return activeOperation ? { ...activeOperation } : { active: false };
    },
    requestCancellation() {
      return { accepted: false, reason: 'no-active-operation' };
    }
  };
  const manifest = { id: 'test-adapter', name: 'Test Adapter', version: '1.0.0', platform: 'test', ui: { labels: {}, operations: [] } };
  const adapter = { manifest, navigation: { ...DCE.discord.navigation, describe() {}, navigate() {}, updateCache: async () => {}, startObserver() {} }, collector: { ...DCE.discord.collector, parse() {}, loadHistorical() {} }, topology: DCE.discord.topology || {}, discovery: {} };
  DCE.platformRuntime = { initialize: async () => adapter, requireAdapter: () => adapter, manifest: () => manifest };
  DCE.uiTranslator = { describe: () => ({ adapterId: manifest.id, platform: manifest.platform }) };
  load('content.js', { DCE, chrome });
  return { DCE, listener };
}

function send(listener, request) {
  return new Promise(resolve => listener(request, {}, resolve));
}

test('failed collection still restores the original conversation', async () => {
  let restores = 0;
  const { listener, DCE } = setup();
  DCE.acquisition.restore = async () => { restores += 1; return true; };
  const result = await send(listener, { action: 'executeExport', strategy: 'navigate', options: {} });
  assert.equal(result.success, false);
  assert.equal(result.restored, true);
  assert.equal(restores, 1);
});

test('overlapping collection requests are rejected without touching shared state', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const { listener, DCE } = setup();
  DCE.exporter.exportConversation = () => gate;
  const first = send(listener, { action: 'executeExport', strategy: 'current', options: {} });
  await new Promise(resolve => setImmediate(resolve));
  const second = await send(listener, { action: 'executeExport', strategy: 'current', options: {} });
  assert.equal(second.busy, true);
  release({ success: true });
  assert.equal((await first).success, true);
});

test('topology export path does not invoke message acquisition', async () => {
  let acquisitions = 0;
  const topologyExporter = { exportServerTopology: format => ({ success: true, format, statistics: { channels: 3 } }) };
  const { listener, DCE } = setup({ topologyExporter });
  DCE.discord.topology = {};
  DCE.acquisition.acquire = async () => { acquisitions += 1; throw new Error('must not run'); };
  const result = await send(listener, { action: 'exportServerTopology', format: 'json' });
  assert.equal(result.success, true);
  assert.equal(result.statistics.channels, 3);
  assert.equal(acquisitions, 0);
});
