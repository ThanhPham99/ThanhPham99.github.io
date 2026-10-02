// In-memory implementation of the store contract (see store-firestore.js). Used by ?demo=1 and the Node tests.
import { applyDelta, entryType, normalizeTag, roundNum, todayStr } from './domain.js';

export function createMemoryStore() {
  let seq = 0;
  const nextId = (prefix) => `${prefix}${++seq}`;
  let categories = [];
  let items = [];
  let prefs = {};
  const entries = new Map(); // itemId -> Entry[]
  const listeners = new Set();
  const entryListeners = new Map(); // itemId -> Set<cb>

  const copyEntries = (itemId) => (entries.get(itemId) ?? []).map((e) => ({ ...e }));
  const snapshot = () => ({
    categories: [...categories].sort((a, b) => a.order - b.order).map((c) => ({ ...c })),
    items: items.map((i) => ({ ...i })),
    prefs: { ...prefs },
  });
  const emit = () => {
    const s = snapshot();
    listeners.forEach((cb) => cb(s));
    entryListeners.forEach((cbs, itemId) => {
      const list = copyEntries(itemId);
      cbs.forEach((cb) => cb(list));
    });
  };
  const findItem = (itemId) => {
    const it = items.find((i) => i.id === itemId);
    if (!it) throw new Error('NOT_FOUND');
    return it;
  };
  const findEntry = (itemId, entryId) => {
    const e = (entries.get(itemId) ?? []).find((x) => x.id === entryId);
    if (!e) throw new Error('NOT_FOUND');
    return e;
  };
  const assertAmount = (amount) => {
    if (!Number.isFinite(amount) || amount === 0) throw new Error('INVALID_NUMBER');
  };
  const pushEntry = (itemId, { amount, date, note = '', type }) => {
    const id = nextId('e');
    const list = entries.get(itemId) ?? [];
    list.push({ id, amount, date, note, type, createdAt: Date.now() + seq });
    entries.set(itemId, list);
    return id;
  };

  return {
    setErrorHandler() {},
    subscribe(cb) {
      listeners.add(cb);
      cb(snapshot());
      return () => listeners.delete(cb);
    },
    subscribeEntries(itemId, cb) {
      const set = entryListeners.get(itemId) ?? new Set();
      set.add(cb);
      entryListeners.set(itemId, set);
      cb(copyEntries(itemId));
      return () => set.delete(cb);
    },
    async listEntries(itemId) {
      findItem(itemId);
      return copyEntries(itemId);
    },
    async savePrefs(patch) {
      prefs = { ...prefs, ...patch };
      emit();
    },
    async addCategory({ name, color, icon }) {
      const id = nextId('c');
      const order = Math.max(-1, ...categories.map((c) => c.order)) + 1;
      categories.push({ id, name: name.trim(), color, icon, order, archived: false, createdAt: Date.now() });
      emit();
      return id;
    },
    async updateCategory(categoryId, { name, color, icon }) {
      const c = categories.find((x) => x.id === categoryId);
      if (!c) throw new Error('NOT_FOUND');
      Object.assign(c, { name: name.trim(), color, icon });
      emit();
    },
    async setCategoryArchived(categoryId, archived) {
      const c = categories.find((x) => x.id === categoryId);
      if (!c) throw new Error('NOT_FOUND');
      c.archived = archived;
      emit();
    },
    async reorderCategories(ids) {
      ids.forEach((id, order) => {
        const c = categories.find((x) => x.id === id);
        if (c) c.order = order;
      });
      emit();
    },
    async deleteCategory(categoryId) {
      items.filter((i) => i.categoryId === categoryId).forEach((i) => entries.delete(i.id));
      items = items.filter((i) => i.categoryId !== categoryId);
      categories = categories.filter((c) => c.id !== categoryId);
      emit();
    },
    async addItem({ categoryId, name, target, current = 0, tag = null, deadline = null, note = '', createdAt = Date.now() }) {
      const start = roundNum(current);
      if (!Number.isFinite(start)) throw new Error('INVALID_NUMBER');
      if (start < 0) throw new Error('NEGATIVE_CURRENT');
      const id = nextId('i');
      items.push({
        id, categoryId, name: name.trim(), target, current: start, tag: normalizeTag(tag),
        deadline: deadline || null, note, archived: false, createdAt, updatedAt: createdAt,
      });
      if (start > 0) pushEntry(id, { amount: start, date: todayStr(), type: 'adjust' });
      emit();
      return id;
    },
    async updateItem(itemId, patch) {
      const { current, id, ...rest } = patch;
      const it = findItem(itemId);
      if ('tag' in rest) rest.tag = normalizeTag(rest.tag);
      Object.assign(it, rest, { updatedAt: Date.now() });
      emit();
    },
    async setCurrent(itemId, value, note = '') {
      const it = findItem(itemId);
      const delta = roundNum(value - it.current);
      if (delta === 0) return;
      it.current = applyDelta(it.current, delta);
      it.updatedAt = Date.now();
      pushEntry(itemId, { amount: delta, date: todayStr(), note, type: 'adjust' });
      emit();
    },
    async deleteItem(itemId) {
      findItem(itemId);
      items = items.filter((i) => i.id !== itemId);
      entries.delete(itemId);
      emit();
    },
    async renameTag(categoryId, oldTag, newTag) {
      const tag = normalizeTag(newTag);
      items.filter((i) => i.categoryId === categoryId && i.tag === oldTag).forEach((i) => {
        i.tag = tag;
        i.updatedAt = Date.now();
      });
      emit();
    },
    async addEntry(itemId, { amount, date, note = '' }) {
      assertAmount(amount);
      const it = findItem(itemId);
      it.current = applyDelta(it.current, amount);
      const id = pushEntry(itemId, { amount, date, note, type: entryType(amount) });
      emit();
      return id;
    },
    async updateEntry(itemId, entry, { amount, date, note = '' }) {
      assertAmount(amount);
      const it = findItem(itemId);
      const e = findEntry(itemId, entry.id);
      it.current = applyDelta(it.current, amount - e.amount);
      Object.assign(e, { amount, date, note, type: e.type === 'adjust' ? 'adjust' : entryType(amount) });
      emit();
    },
    async deleteEntry(itemId, entry) {
      const it = findItem(itemId);
      const e = findEntry(itemId, entry.id);
      it.current = applyDelta(it.current, -e.amount);
      entries.set(itemId, entries.get(itemId).filter((x) => x.id !== e.id));
      emit();
    },
  };
}
