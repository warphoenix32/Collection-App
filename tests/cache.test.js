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
