const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');

test('detection engine selects the highest-confidence registered adapter', async () => {
  const DCE = { logger: { warn() {} } };
  load('src/platform/adapter-registry.js', { DCE });
  load('src/platform/detection-engine.js', { DCE });
  const manifest = id => ({ id, name: id, version: '1.0.0', platform: id, capabilities: {}, sources: [], entities: [], exports: [], runtimePolicies: [], ui: {} });
  DCE.adapterRegistry.register({ manifest: manifest('low'), detect: () => 0.25, createRuntime: () => ({}) });
  DCE.adapterRegistry.register({ manifest: manifest('high'), detect: () => 0.9, createRuntime: () => ({}) });
  assert.throws(() => DCE.adapterRegistry.register({ manifest: manifest('high'), detect: () => 1, createRuntime: () => ({}) }), /already registered/);
  assert.throws(() => DCE.adapterRegistry.register({ manifest: { id: 'broken' }, detect: () => 1, createRuntime: () => ({}) }), /missing/);
  const result = await DCE.detectionEngine.detect({ hostname: 'example.test' });
  assert.equal(result.winner.manifest.id, 'high');
  assert.equal(result.confidence, 0.9);
});

test('Discord adapter self-registers with independent version and canonical runtime', () => {
  const noop = () => {};
  const navigation = { describeCurrentConversation: noop, navigateWithinDiscord: noop, canonicalConversationUrl: noop, updateNavigationCache: noop, startNavigationObserver: noop };
  const collector = { resetAcquisitionBuffer: noop, loadOlderMessagesUntil: noop, parseLoadedMessages: noop };
  const DCE = { discord: { navigation, collector, parser: {}, topology: { discoverServerTopology: noop }, discovery: { scanServers: () => [], scanChannels: () => [] } } };
  load('src/platform/adapter-registry.js', { DCE });
  load('src/adapters/discord/adapter-manifest.js', { DCE });
  load('src/adapters/discord/register.js', { DCE });
  const definition = DCE.adapterRegistry.get('discord-reference');
  const runtime = definition.createRuntime({ host: {}, manifest: definition.manifest });
  assert.equal(definition.manifest.version, '1.0.0');
  assert.equal(definition.manifest.compatibility.platform, '>=4.0.0 <5.0.0');
  assert.equal(runtime.navigation.navigate, navigation.navigateWithinDiscord);
  assert.equal(runtime.collector.loadHistorical, collector.loadOlderMessagesUntil);
});

test('discovery framework normalizes supported and unsupported discovery', async () => {
  const DCE = {};
  load('src/platform/discovery-framework.js', { DCE });
  const adapter = { manifest: { id: 'adapter' }, discovery: { source: async () => ({ items: [{ id: 'source-1' }] }) } };
  const supported = await DCE.discoveryFramework.discover(adapter, 'source');
  const unsupported = await DCE.discoveryFramework.discover(adapter, 'topology');
  assert.equal(supported.items[0].id, 'source-1');
  assert.equal(unsupported.supported, false);
});

test('UI translation maps legacy navigation into canonical workspace and source terms', () => {
  const DCE = {};
  load('src/platform/ui-translator.js', { DCE });
  const view = DCE.uiTranslator.navigation({ servers: [{ id: 'w1' }], channelsByServer: { w1: [{ id: 's1' }] }, current: { serverId: 'w1', channelId: 's1' } });
  assert.equal(view.workspaces[0].id, 'w1');
  assert.equal(view.sourcesByWorkspace.w1[0].id, 's1');
  assert.equal(view.current.sourceId, 's1');
});

test('platform acquisition facade works without a Discord global in reusable core', async () => {
  let resets = 0, navigated = null;
  const adapter = {
    collector: { reset: () => { resets += 1; } },
    navigation: {
      canonicalize: value => value,
      navigate: async value => { navigated = value; },
      describe: target => ({ platform: 'test', conversation: { id: target?.channelId || 'current' } })
    }
  };
  const DCE = { platformRuntime: { requireAdapter: () => adapter } };
  const location = { href: 'https://source.test/current' };
  load('src/core/acquisition/acquisition.js', { DCE, location });
  const result = await DCE.acquisition.acquire('navigate', { target: { url: 'https://source.test/target', channelId: 'target' } });
  assert.equal(resets, 1);
  assert.equal(navigated, 'https://source.test/target');
  assert.equal(result.source.platform, 'test');
});

test('mission profiles normalize legacy profiles into executable intent and policy', () => {
  const DCE = {
    config: { acquisitionDefaultMaxRuntimeMs: 1000, loadOlderProgressLogInterval: 10, batchItemRetryCount: 1 },
    sdk: { createJobId: () => 'profile-1' }, platformRuntime: { manifest: () => ({ platform: 'discord' }) }
  };
  load('src/platform/runtime-policies.js', { DCE });
  load('src/platform/collection-intent.js', { DCE });
  load('src/platform/mission-profile.js', { DCE });
  const profile = DCE.missionProfile.normalize({ name: 'Archive', targets: [{ platform: 'discord' }], options: { maxRuntimeMs: 5000 } });
  assert.equal(profile.schemaVersion, '2.0.0');
  assert.equal(profile.intent.id, 'archival');
  assert.equal(profile.runtimePolicy.historicalRuntimeMs, 5000);
  assert.equal(profile.sources.length, 1);
});

test('Knowledge Object enforces canonical identity and original source', () => {
  const DCE = {};
  load('src/platform/knowledge-object.js', { DCE });
  assert.throws(() => DCE.knowledgeObject.create({}), /identity\.id/);
  const object = DCE.knowledgeObject.create({ identity: { id: 'message-1' }, source: { original: 'https://source.test/1' }, platform: 'test', content: { text: 'hello' }, confidence: 0.8 });
  assert.equal(object.schemaName, 'collection-platform-knowledge-object');
  assert.equal(object.confidence, 0.8);
});
