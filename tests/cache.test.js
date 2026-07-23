const test = require('node:test');
const assert = require('node:assert/strict');
const { load } = require('./helpers');

test('acquisition checkpoints round-trip and clear through extension storage', async () => {
  const data = {};
  const chrome = { storage: { local: {
    async get(key) { return { [key]: data[key] }; },
    async set(values) { Object.assign(data, values); },
    async remove(key) { delete data[key]; }
  } } };
  const DCE = { config: { navigationCacheKey: 'nav', acquisitionCheckpointKey: 'checkpoint' } };
  load('src/core/cache.js', { DCE, chrome });
  const checkpoint = { version: 2, messages: [{ messageId: '1' }] };
  assert.deepEqual(await DCE.cache.writeAcquisitionCheckpoint(checkpoint), checkpoint);
  assert.equal((await DCE.cache.readAcquisitionCheckpoint()).messages[0].messageId, '1');
  await DCE.cache.clearAcquisitionCheckpoint();
  assert.equal(await DCE.cache.readAcquisitionCheckpoint(), null);
});

test('acquisition checkpoints prefer chunked background storage', async () => {
  let checkpoint = null;
  const chrome = {
    runtime: { async sendMessage(request) {
      if (request.action === 'write') checkpoint = request.checkpoint;
      if (request.action === 'clear') checkpoint = null;
      return { success: true, value: request.action === 'read' ? checkpoint : null };
    } },
    storage: { local: { async get() { return {}; }, async set() {}, async remove() {} } }
  };
  const DCE = { config: { navigationCacheKey: 'nav', acquisitionCheckpointKey: 'checkpoint', checkpointChunkSize: 500 }, logger: { warn() {} } };
  load('src/core/cache.js', { DCE, chrome });
  await DCE.cache.writeAcquisitionCheckpoint({ version: 3, messages: [{ messageId: 'native-1' }] });
  assert.equal((await DCE.cache.readAcquisitionCheckpoint()).messages[0].messageId, 'native-1');
  await DCE.cache.clearAcquisitionCheckpoint();
  assert.equal(await DCE.cache.readAcquisitionCheckpoint(), null);
});
