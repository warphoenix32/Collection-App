const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { load } = require('./helpers');

test('popup exposes only canonical archival JSON collection', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'popup.html'), 'utf8');
  const script = fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8');
  assert.doesNotMatch(html, /id="intent"/);
  assert.doesNotMatch(html, /id="format"/);
  assert.match(html, /Canonical archival JSON/);
  assert.match(script, /format:'json'/);
  assert.match(script, /intent:'archival'/);
});

test('structured failures provide stable codes and retry guidance', () => {
  const DCE = {};
  load('src/core/diagnostics/errors.js', { DCE });
  assert.equal(DCE.errors.classify(new Error('Could not identify the conversation scroller')).code, 'no-scroller');
  assert.equal(DCE.errors.classify(new Error('IndexedDB transaction failed')).code, 'storage-failure');
  assert.equal(DCE.errors.classify(new Error('No messages matched the selected range.')).retryable, false);
});

test('job state persists last collected bounds for popup-independent monitoring', async () => {
  const data = {};
  const chrome = { storage: { local: {
    async set(values) { Object.assign(data, values); },
    async get(key) { return { [key]: data[key] }; }
  } } };
  const crypto = { randomUUID: () => 'job-1' };
  const DCE = { config: { activeJobStorageKey: 'active' } };
  load('src/core/job-state.js', { DCE, chrome, crypto });
  await DCE.jobState.start({ requestedRange: { start: '2023-01-01T00:00:00.000Z', end: '2023-12-31T23:59:59.999Z' } });
  await DCE.jobState.update({ messagesAccumulated: 25, earliestCollected: '2023-12-01T00:00:00.000Z' });
  const state = await DCE.jobState.finish({ status: 'partial', stopReason: 'exception' });
  assert.equal(state.intent, 'archival');
  assert.equal(state.format, 'json');
  assert.equal(state.messagesAccumulated, 25);
  assert.equal(data.active.stopReason, 'exception');
});

test('conversation JSON retains Discord native IDs and timestamp-offset evidence', () => {
  const participant = { participantId: 'discord-user-42' };
  const participants = new Map([['discord:42', participant]]);
  const DCE = {
    config: { adapterVersion: '1.1.0', schemaVersion: '2.0.0', extensionVersion: '4.1.0', platformVersion: '4.1.0', identityEngineVersion: '1.0.0', excludedMedia: [] },
    identity: {
      observationKey: author => `discord:${author.userId}`,
      build: () => participants,
      resolve: () => participant
    },
    platformRuntime: { manifest: () => ({ id: 'discord-reference', name: 'Discord Reference Adapter', version: '1.1.0', platform: 'discord' }) },
    collectionIntent: { normalize: () => ({ id: 'archival' }) },
    runtimePolicies: { resolve: policy => policy }
  };
  load('src/core/conversation-model.js', { DCE, crypto: { randomUUID: () => 'export-1' } });
  const discordNative = {
    guildId: '10', channelId: '20', messageId: '30', authorId: '42',
    replyMessageId: null, jumpLink: 'https://discord.com/channels/10/20/30',
    timestampOriginal: '2023-01-01T00:00:00.000Z', timestampOffset: 'Z'
  };
  const model = DCE.conversationModel.buildConversation({
    rawMessages: [{
      messageId: '30', timestamp: discordNative.timestampOriginal, author: { userId: '42', displayName: 'Archivist', inferred: false },
      content: 'evidence', attachments: [], mentions: [], discordNative
    }],
    source: {
      platform: 'discord', type: 'channel', acquisitionStrategy: 'current', url: discordNative.jumpLink,
      workspace: { id: '10', name: 'Star Atlas' }, conversation: { id: '20', name: 'fr-chat' },
      platformMetadata: { discordContext: { guildId: '10', channelId: '20' } }
    },
    options: { intent: 'archival' },
    collectionReport: { complete: true, warnings: [], coverage: { confidence: 'high' } },
    startedAt: 1,
    finishedAt: 2
  });
  assert.deepEqual(model.messages[0].provenance.discordNative, discordNative);
  assert.equal(model.source.platformMetadata.discordContext.guildId, '10');
  assert.equal(model.provenance.collectionIntent, 'archival');
});
