import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryStore } from '../js/store-memory.js';
import { seedDemo } from '../js/demo-seed.js';

function setup() {
  const store = createMemoryStore();
  let state;
  store.subscribe((s) => { state = s; });
  return { store, get: () => state, itemOf: (id) => state.items.find((i) => i.id === id) };
}
const newItem = (store, over = {}) => store.addItem({ categoryId: 'c1', name: 'Goal', target: 100, ...over });

test('categories get increasing order and can be reordered', async () => {
  const { store, get } = setup();
  const a = await store.addCategory({ name: ' A ', color: 'sky', icon: 'wallet' });
  const b = await store.addCategory({ name: 'B', color: 'rose', icon: 'gift' });
  assert.deepEqual(get().categories.map((c) => c.name), ['A', 'B']);
  await store.reorderCategories([b, a]);
  assert.deepEqual(get().categories.map((c) => c.id), [b, a]);
});

test('addItem with a starting value records an adjust entry and normalises the tag', async () => {
  const { store, itemOf } = setup();
  const id = await newItem(store, { current: 30, tag: '  Du   lịch ' });
  assert.equal(itemOf(id).current, 30);
  assert.equal(itemOf(id).tag, 'Du lịch');
  const entries = await store.listEntries(id);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].type, 'adjust');
  assert.equal(entries[0].amount, 30);
});

test('entries move current and can never push it below zero', async () => {
  const { store, itemOf } = setup();
  const id = await newItem(store);
  await store.addEntry(id, { amount: 100, date: '2026-01-01' });
  await store.addEntry(id, { amount: -80, date: '2026-01-02' });
  assert.equal(itemOf(id).current, 20);
  await assert.rejects(store.addEntry(id, { amount: -21, date: '2026-01-03' }), /NEGATIVE_CURRENT/);
  const deposit = (await store.listEntries(id)).find((e) => e.amount === 100);
  assert.equal(deposit.type, 'deposit');
  await assert.rejects(store.updateEntry(id, deposit, { amount: 50, date: deposit.date }), /NEGATIVE_CURRENT/);
  await assert.rejects(store.deleteEntry(id, deposit), /NEGATIVE_CURRENT/);
  assert.equal(itemOf(id).current, 20);
  assert.equal((await store.listEntries(id)).length, 2);
  await store.updateEntry(id, deposit, { amount: 90, date: deposit.date, note: 'fix' });
  assert.equal(itemOf(id).current, 10);
});

test('zero or non-numeric amounts are rejected', async () => {
  const { store } = setup();
  const id = await newItem(store);
  await assert.rejects(store.addEntry(id, { amount: 0, date: '2026-01-01' }), /INVALID_NUMBER/);
  await assert.rejects(store.addEntry(id, { amount: NaN, date: '2026-01-01' }), /INVALID_NUMBER/);
});

test('setCurrent records only the difference', async () => {
  const { store, itemOf } = setup();
  const id = await newItem(store);
  await store.setCurrent(id, 40);
  await store.setCurrent(id, 25);
  await store.setCurrent(id, 25);
  assert.equal(itemOf(id).current, 25);
  assert.deepEqual((await store.listEntries(id)).map((e) => [e.type, e.amount]), [['adjust', 40], ['adjust', -15]]);
  await assert.rejects(store.setCurrent(id, -1), /NEGATIVE_CURRENT/);
});

test('updateItem ignores current', async () => {
  const { store, itemOf } = setup();
  const id = await newItem(store, { current: 10 });
  await store.updateItem(id, { name: 'Renamed', current: 99 });
  assert.equal(itemOf(id).name, 'Renamed');
  assert.equal(itemOf(id).current, 10);
});

test('renameTag only touches the given category', async () => {
  const { store, itemOf } = setup();
  const a = await newItem(store, { tag: 'x' });
  const b = await newItem(store, { categoryId: 'c2', tag: 'x' });
  await store.renameTag('c1', 'x', ' y ');
  assert.equal(itemOf(a).tag, 'y');
  assert.equal(itemOf(b).tag, 'x');
});

test('deleteCategory removes its items and their entries', async () => {
  const { store, get } = setup();
  const keep = await store.addCategory({ name: 'Keep', color: 'sky', icon: 'wallet' });
  const drop = await store.addCategory({ name: 'Drop', color: 'sky', icon: 'wallet' });
  const kept = await newItem(store, { categoryId: keep, current: 5 });
  const gone = await newItem(store, { categoryId: drop, current: 5 });
  await store.deleteCategory(drop);
  assert.deepEqual(get().categories.map((c) => c.id), [keep]);
  assert.deepEqual(get().items.map((i) => i.id), [kept]);
  await assert.rejects(store.listEntries(gone), /NOT_FOUND/);
});

test('deleteItem removes the item; goals cannot be archived on their own', async () => {
  const { store, get } = setup();
  const id = await newItem(store);
  assert.equal(store.setArchived, undefined);
  await store.deleteItem(id);
  assert.equal(get().items.length, 0);
});

test('subscribeEntries pushes updates until unsubscribed', async () => {
  const { store } = setup();
  const id = await newItem(store);
  const seen = [];
  const off = store.subscribeEntries(id, (list) => seen.push(list.length));
  await store.addEntry(id, { amount: 5, date: '2026-01-01' });
  off();
  await store.addEntry(id, { amount: 5, date: '2026-01-02' });
  assert.deepEqual(seen, [0, 1]);
});

test('demo seed builds a consistent dataset', async () => {
  const { store, get } = setup();
  await seedDemo(store);
  const { categories, items } = get();
  assert.deepEqual(categories.map((c) => c.id), ['c1', 'c2', 'c3', 'c4']);
  assert.deepEqual(categories.map((c) => c.archived), [false, false, false, true]);
  assert.ok(items.length >= 10);
  assert.ok(items.every((i) => !i.archived));
  assert.ok(items.some((i) => i.categoryId === 'c4'));
  for (const it of items) {
    const sum = (await store.listEntries(it.id)).reduce((s, e) => s + e.amount, 0);
    assert.ok(Math.abs(sum - it.current) < 1e-9, it.name);
    assert.ok(it.current >= 0, it.name);
  }
});

test('categories can be archived and restored without touching their goals', async () => {
  const { store, get, itemOf } = setup();
  const c = await store.addCategory({ name: 'A', color: 'sky', icon: 'wallet' });
  const id = await newItem(store, { categoryId: c });
  assert.equal(get().categories[0].archived, false);
  await store.setCategoryArchived(c, true);
  assert.equal(get().categories[0].archived, true);
  assert.equal(itemOf(id).archived, false);
  await store.updateCategory(c, { name: 'B', color: 'rose', icon: 'gift' });
  assert.equal(get().categories[0].archived, true);
  await store.setCategoryArchived(c, false);
  assert.equal(get().categories[0].archived, false);
});
