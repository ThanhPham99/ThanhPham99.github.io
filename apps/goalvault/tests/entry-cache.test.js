import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEntryCache } from '../js/entry-cache.js';

test('entries are refetched only for items whose value changed', async () => {
  const calls = [];
  const cache = createEntryCache(async (id) => { calls.push(id); return [{ id: `${id}-e` }]; });
  const a = { id: 'a', current: 1, updatedAt: 1 };
  const b = { id: 'b', current: 2, updatedAt: 1 };
  await cache.rowsFor([a, b]);
  await cache.rowsFor([a, b]);
  assert.deepEqual(calls, ['a', 'b']);
  const rows = await cache.rowsFor([a, { ...b, current: 3, updatedAt: 2 }]);
  assert.deepEqual(calls, ['a', 'b', 'b']);
  assert.deepEqual(rows.map((r) => r.entries[0].id), ['a-e', 'b-e']);
});

test('a failed fetch is not cached', async () => {
  let fail = true;
  const cache = createEntryCache(async () => { if (fail) throw new Error('offline'); return []; });
  const a = { id: 'a', current: 1, updatedAt: 1 };
  await assert.rejects(cache.rowsFor([a]), /offline/);
  fail = false;
  assert.deepEqual(await cache.rowsFor([a]), [{ item: a, entries: [] }]);
});
