import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isFirestoreBlocked } from '../js/connectivity.js';

test('reachable endpoint (any opaque response) is not blocked', async () => {
  assert.equal(await isFirestoreBlocked({ fetch: async () => ({ type: 'opaque' }), online: true }), false);
});

test('a rejected request while online means a blocker (e.g. ERR_BLOCKED_BY_CLIENT)', async () => {
  const fetch = async () => { throw new TypeError('Failed to fetch'); };
  assert.equal(await isFirestoreBlocked({ fetch, online: true }), true);
});

test('being offline is not reported as blocked', async () => {
  const fetch = async () => { throw new TypeError('Failed to fetch'); };
  assert.equal(await isFirestoreBlocked({ fetch, online: false }), false);
});

test('a slow network is not reported as blocked', async () => {
  const fetch = () => new Promise(() => {});
  assert.equal(await isFirestoreBlocked({ fetch, online: true, timeoutMs: 20 }), false);
});

test('probes the Firestore channel path that blockers match', async () => {
  let seen;
  await isFirestoreBlocked({ fetch: async (url, opts) => { seen = { url, opts }; return {}; }, online: true });
  assert.match(seen.url, /^https:\/\/firestore\.googleapis\.com\/google\.firestore\.v1\.Firestore\/Listen\/channel/);
  assert.equal(seen.opts.mode, 'no-cors');
});
