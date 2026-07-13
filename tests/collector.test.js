const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');

function setup(elements, checkpoint = null) {
  const timeNodes = elements.map(item => ({ getAttribute: () => item.timestamp }));
  const scroller = { scrollHeight: 1000, clientHeight: 500, scrollTop: 0, parentElement: null, dispatchEvent() {}, focus() {} };
  for (const item of elements) item.parentElement = scroller;
  const document = {
    body: {},
    querySelector: selector => selector === 'message' ? elements[0] : null,
    querySelectorAll: selector => selector === 'message' ? elements : (selector === 'message time[datetime]' ? timeNodes : [])
  };
  const writes = [];
  const DCE = {
    config: { loadOlderInitialDelayMs: 1, loadOlderMaxWaitMs: 1, loadOlderSoftStallLimit: 1, loadOlderProgressLogInterval: 10,
      acquisitionDefaultMaxRuntimeMs: 1000, acquisitionMinimumMaxRuntimeMs: 1, acquisitionMaximumMaxRuntimeMs: 1000 },
    discord: { selectors: { message: 'message' }, parser: { parseMessage: item => item }, navigation: { canonicalConversationUrl: url => url } },
    cache: { readAcquisitionCheckpoint: async () => checkpoint, writeAcquisitionCheckpoint: async value => writes.push(value) },
    logger: { info() {}, warn() {} }
  };
  load('src/adapters/discord/collector.js', { DCE, document, location: { href: 'https://discord.com/channels/1/2' },
    getComputedStyle: () => ({ overflowY: 'auto' }), Event: class {}, WheelEvent: class {}, KeyboardEvent: class {}, window: { dispatchEvent() {} } });
  return { DCE, writes };
}

test('large virtualized message sets deduplicate deterministically without argument spreading', () => {
  const elements = Array.from({ length: 30000 }, (_, index) => ({
    messageId: String(index % 15000), timestamp: new Date(1700000000000 + (index % 15000) * 1000).toISOString(),
    author: { displayName: 'operator', inferred: false }, content: `message ${index % 15000}`
  }));
  const { DCE } = setup(elements);
  const messages = DCE.discord.collector.parseLoadedMessages();
  assert.equal(messages.length, 15000);
  assert.equal(messages[0].messageId, '0');
  assert.equal(messages.at(-1).messageId, '14999');
});

test('interrupted acquisition restores persisted message data', async () => {
  const cutoff = '2025-01-01T00:00:00.000Z';
  const saved = { messageId: 'saved', timestamp: '2024-01-01T00:00:00.000Z', author: { displayName: 'saved', inferred: false }, content: 'persisted' };
  const checkpoint = { version: 2, complete: false, cutoff, url: 'https://discord.com/channels/1/2', savedAt: '2026-01-01T00:00:00.000Z', cycles: 9, recoveries: 2, messages: [saved] };
  const visible = { messageId: 'visible', timestamp: '2024-06-01T00:00:00.000Z', author: { displayName: 'visible', inferred: false }, content: 'rendered' };
  const { DCE } = setup([visible], checkpoint);
  const report = await DCE.discord.collector.loadOlderMessagesUntil(cutoff, { maxRuntimeMs: 10 });
  assert.equal(report.resumed, true);
  assert.equal(report.stopReason, 'cutoff-reached');
  assert.deepEqual(Array.from(DCE.discord.collector.parseLoadedMessages(), item => item.messageId), ['saved', 'visible']);
});
