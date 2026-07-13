const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');

class NodeStub {
  constructor(attrs = {}, text = '', anchor = null) { this.attrs = attrs; this.textContent = text; this.anchor = anchor; }
  getAttribute(name) { return this.attrs[name] ?? null; }
  matches(selector) {
    if (selector === 'a[href]') return this.attrs.tag === 'a' && Boolean(this.attrs.href);
    if (selector === 'category') return this.attrs.category === 'true';
    return false;
  }
  querySelector(selector) {
    if (selector === 'a[href]') return this.anchor;
    return null;
  }
  closest() { return this; }
}

function topologyRuntime(nodes) {
  const DCE = {
    config: { topologySchemaVersion: '1.0.0' }, renderers: {},
    sdk: { normalizeWhitespace: value => String(value || '').replace(/\s+/g, ' ').trim() },
    logger: { info() {} },
    discord: {
      selectors: { categoryToggle: 'category', topologyNode: 'topology' },
      navigation: { currentLocationIds: () => ({ serverId: '100000', channelId: '200000', isDirect: false }) },
      discovery: { scanServers: () => [{ id: '100000', name: 'Archive Guild' }] }
    }
  };
  const document = { querySelectorAll: () => nodes };
  load('src/adapters/discord/topology.js', { DCE, document, location: { href: 'https://discord.com/channels/100000/200000' } });
  load('src/core/topology-model.js', { DCE });
  load('src/core/renderers/topology-json.js', { DCE });
  load('src/core/renderers/topology-markdown.js', { DCE });
  return DCE;
}

function channel(id, label, path = null, extra = {}) {
  const anchor = path ? new NodeStub({ tag: 'a', href: path, 'aria-label': label }) : null;
  return new NodeStub({ 'data-list-item-id': `channels___${id}`, 'aria-label': label, ...extra }, label, anchor);
}

test('Discord topology observation preserves categories, forums, threads, and unreadable metadata', () => {
  const nodes = [
    new NodeStub({ category: 'true', role: 'button', 'aria-expanded': 'false', 'data-list-item-id': 'channels___300000' }, 'Planning'),
    channel('400000', 'general (text channel)', '/channels/100000/400000'),
    channel('400001', 'staff-planning (text channel)'),
    channel('400002', 'proposals (forum channel)', '/channels/100000/400002'),
    channel('400003', 'decision thread', '/channels/100000/400000/400003', { 'data-channel-type': 'thread', 'data-archived': 'true' })
  ];
  const DCE = topologyRuntime(nodes);
  const model = DCE.topologyModel.build(DCE.discord.topology.discoverServerTopology());
  assert.equal(model.server.name, 'Archive Guild');
  assert.equal(model.categories.length, 1);
  assert.equal(model.categories[0].collapsed, true);
  assert.equal(model.channels.length, 4);
  assert.equal(model.channels.find(item => item.id === '400001').visibilityState, 'known-unreadable');
  assert.equal(model.channels.find(item => item.id === '400001').canCollect, false);
  assert.equal(model.forums.length, 1);
  assert.equal(model.threads.length, 1);
  assert.equal(model.threads[0].parentId, '400000');
  assert.equal(model.threads[0].archived, true);
  assert.match(DCE.renderers.topologyMarkdown(model), /Known unreadable: 1/);
  assert.equal(JSON.parse(DCE.renderers.topologyJson(model)).schemaVersion, '1.0.0');
});

test('topology model never invents objects without exposed channel ids', () => {
  const DCE = topologyRuntime([]);
  const model = DCE.topologyModel.build({ server: { id: '100000' }, categories: [], channels: [{ name: 'hidden' }] });
  assert.equal(model.channels.length, 0);
});
