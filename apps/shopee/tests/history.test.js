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

test('adds, deduplicates single-item visits by affiliate URL across bare & prose inputs, removes, and caps at 20', () => {
  const store = createHistoryStore(memoryStorage());
  assert.deepEqual(store.list(), []);

  store.add({
    rawInput: 'https://shopee.vn/product/1/2',
    outputText: 'https://s.shopee.vn/an_redir?origin_link=a&affiliate_id=17360400567',
    label: 'Món hàng #2',
    convertedCount: 1,
    firstAffiliateUrl: 'https://s.shopee.vn/an_redir?origin_link=a&affiliate_id=17360400567',
    isSingleBareLink: true,
    isSingleItem: true,
    createdAt: 1000,
  });

  // Re-adding same item via Shopee mobile share prose deduplicates and updates title/timestamp
  store.add({
    rawInput: 'Hãy mua ngay sản phẩm Tai nghe X trên Shopee! https://shopee.vn/product/1/2?sp_atk=x',
    outputText: 'https://s.shopee.vn/an_redir?origin_link=a&affiliate_id=17360400567',
    label: 'Tai nghe X',
    convertedCount: 1,
    firstAffiliateUrl: 'https://s.shopee.vn/an_redir?origin_link=a&affiliate_id=17360400567',
    isSingleBareLink: false,
    isSingleItem: true,
    createdAt: 2000,
  });

  assert.equal(store.list().length, 1);
  assert.equal(store.list()[0].createdAt, 2000);
  assert.equal(store.list()[0].label, 'Tai nghe X');

  for (let i = 0; i < 25; i++) {
    store.add({
      rawInput: `https://shopee.vn/product/1/${i}`,
      outputText: `https://s.shopee.vn/an_redir?origin_link=${i}&affiliate_id=17360400567`,
      label: `Món hàng #${i}`,
      convertedCount: 1,
      firstAffiliateUrl: `https://s.shopee.vn/an_redir?origin_link=${i}&affiliate_id=17360400567`,
      isSingleItem: true,
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
