import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_HISTORY_ITEMS, createHistoryStore } from '../js/history.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('adds, deduplicates by outputText, removes, and caps at 20 items', () => {
  const store = createHistoryStore(memoryStorage());
  assert.deepEqual(store.list(), []);

  store.add({
    rawInput: 'https://shopee.vn/product/1/2',
    outputText: 'https://s.shopee.vn/an_redir?origin_link=a&affiliate_id=17360400567',
    label: 'Sản phẩm #2',
    convertedCount: 1,
    firstAffiliateUrl: 'https://s.shopee.vn/an_redir?origin_link=a&affiliate_id=17360400567',
    isSingleBareLink: true,
    createdAt: 1000,
  });

  // Re-adding identical output moves it to top instead of duplicating
  store.add({
    rawInput: 'https://shopee.vn/product/1/2?sp_atk=x',
    outputText: 'https://s.shopee.vn/an_redir?origin_link=a&affiliate_id=17360400567',
    label: 'Sản phẩm #2',
    convertedCount: 1,
    firstAffiliateUrl: 'https://s.shopee.vn/an_redir?origin_link=a&affiliate_id=17360400567',
    isSingleBareLink: true,
    createdAt: 2000,
  });

  assert.equal(store.list().length, 1);
  assert.equal(store.list()[0].createdAt, 2000);

  for (let i = 0; i < 25; i++) {
    store.add({
      rawInput: `https://shopee.vn/product/1/${i}`,
      outputText: `https://s.shopee.vn/an_redir?origin_link=${i}&affiliate_id=17360400567`,
      label: `Sản phẩm #${i}`,
      convertedCount: 1,
      createdAt: 3000 + i,
    });
  }

  assert.equal(store.list().length, MAX_HISTORY_ITEMS);
  const newestId = store.list()[0].id;
  store.remove(newestId);
  assert.equal(store.list().length, MAX_HISTORY_ITEMS - 1);

  store.clear();
  assert.deepEqual(store.list(), []);
});
