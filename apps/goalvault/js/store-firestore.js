// Firestore implementation of the store contract.
// Layout: users/{uid}, users/{uid}/categories/{id}, users/{uid}/items/{id}, users/{uid}/items/{id}/entries/{id}.
import {
  collection, doc, getDocs, increment, onSnapshot, orderBy, query, serverTimestamp, setDoc, writeBatch,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { applyDelta, entryType, normalizeTag, roundNum, todayStr } from './domain.js';

const BATCH_LIMIT = 450;
const toMs = (v) => (typeof v?.toMillis === 'function' ? v.toMillis() : typeof v === 'number' ? v : Date.now());
const readDoc = (snap) => ({ id: snap.id, ...snap.data({ serverTimestamps: 'estimate' }) });
const toCategory = (d) => ({ ...d, createdAt: toMs(d.createdAt) });
const toItem = (d) => ({
  ...d, tag: d.tag ?? null, deadline: d.deadline ?? null, note: d.note ?? '', archived: !!d.archived,
  createdAt: toMs(d.createdAt), updatedAt: toMs(d.updatedAt),
});
const toEntry = (d) => ({ ...d, note: d.note ?? '', createdAt: toMs(d.createdAt) });

export function createFirestoreStore(db, uid) {
  const userRef = doc(db, 'users', uid);
  const categoriesCol = collection(userRef, 'categories');
  const itemsCol = collection(userRef, 'items');
  const itemRef = (itemId) => doc(itemsCol, itemId);
  const entriesCol = (itemId) => collection(itemRef(itemId), 'entries');

  let latest = { categories: [], items: [], prefs: {} };
  let onWriteError = (err) => console.error(err);

  const findItem = (itemId) => {
    const it = latest.items.find((i) => i.id === itemId);
    if (!it) throw new Error('NOT_FOUND');
    return it;
  };
  const assertAmount = (amount) => {
    if (!Number.isFinite(amount) || amount === 0) throw new Error('INVALID_NUMBER');
  };
  // commit() resolves only on server ack, which never comes while offline; the local cache applies the write
  // immediately, so never await it — just report failures.
  const write = (fill) => {
    const batch = writeBatch(db);
    fill(batch);
    batch.commit().catch((err) => onWriteError(err));
  };
  const writeChunked = (ops) => {
    for (let i = 0; i < ops.length; i += BATCH_LIMIT) write((b) => ops.slice(i, i + BATCH_LIMIT).forEach((op) => op(b)));
  };
  // Apply the change as a server-side increment so concurrent offline writes from several devices all count;
  // applyDelta still pre-checks against the cached value, and the rules reject a resolved current < 0.
  const changeCurrent = (b, itemId, delta) => b.update(itemRef(itemId), { current: increment(delta), updatedAt: serverTimestamp() });

  return {
    setErrorHandler(fn) {
      onWriteError = fn;
    },
    subscribe(cb, onError) {
      const loaded = { categories: false, items: false, prefs: false };
      const push = (key, patch) => {
        latest = { ...latest, ...patch };
        loaded[key] = true;
        if (loaded.categories && loaded.items && loaded.prefs) cb(latest);
      };
      const unsubs = [
        onSnapshot(query(categoriesCol, orderBy('order')),
          (s) => push('categories', { categories: s.docs.map((d) => toCategory(readDoc(d))) }), onError),
        onSnapshot(itemsCol, (s) => push('items', { items: s.docs.map((d) => toItem(readDoc(d))) }), onError),
        onSnapshot(userRef, (s) => push('prefs', { prefs: s.data() ?? {} }), onError),
      ];
      return () => unsubs.forEach((u) => u());
    },
    subscribeEntries(itemId, cb, onError) {
      return onSnapshot(entriesCol(itemId), (s) => cb(s.docs.map((d) => toEntry(readDoc(d)))), onError);
    },
    async listEntries(itemId) {
      const s = await getDocs(entriesCol(itemId));
      return s.docs.map((d) => toEntry(readDoc(d)));
    },
    savePrefs(patch) {
      setDoc(userRef, patch, { merge: true }).catch((err) => onWriteError(err));
    },
    addCategory({ name, color, icon }) {
      const ref = doc(categoriesCol);
      const order = Math.max(-1, ...latest.categories.map((c) => c.order ?? 0)) + 1;
      write((b) => b.set(ref, { name: name.trim(), color, icon, order, createdAt: serverTimestamp() }));
      return ref.id;
    },
    updateCategory(categoryId, { name, color, icon }) {
      write((b) => b.update(doc(categoriesCol, categoryId), { name: name.trim(), color, icon }));
    },
    reorderCategories(ids) {
      write((b) => ids.forEach((id, order) => b.update(doc(categoriesCol, id), { order })));
    },
    async deleteCategory(categoryId) {
      const items = latest.items.filter((i) => i.categoryId === categoryId);
      const entrySnaps = await Promise.all(items.map((i) => getDocs(entriesCol(i.id))));
      writeChunked([
        ...entrySnaps.flatMap((s) => s.docs.map((d) => (b) => b.delete(d.ref))),
        ...items.map((i) => (b) => b.delete(itemRef(i.id))),
        (b) => b.delete(doc(categoriesCol, categoryId)),
      ]);
    },
    addItem({ categoryId, name, target, current = 0, tag = null, deadline = null, note = '' }) {
      const start = roundNum(current);
      if (!Number.isFinite(start)) throw new Error('INVALID_NUMBER');
      if (start < 0) throw new Error('NEGATIVE_CURRENT');
      const ref = doc(itemsCol);
      write((b) => {
        b.set(ref, {
          categoryId, name: name.trim(), target, current: start, tag: normalizeTag(tag), deadline: deadline || null,
          note, archived: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        if (start > 0) {
          b.set(doc(entriesCol(ref.id)), { amount: start, date: todayStr(), note: '', type: 'adjust', createdAt: serverTimestamp() });
        }
      });
      return ref.id;
    },
    updateItem(itemId, patch) {
      const { current, id, ...rest } = patch;
      if ('tag' in rest) rest.tag = normalizeTag(rest.tag);
      write((b) => b.update(itemRef(itemId), { ...rest, updatedAt: serverTimestamp() }));
    },
    setCurrent(itemId, value, note = '') {
      const it = findItem(itemId);
      const delta = roundNum(value - it.current);
      if (delta === 0) return;
      applyDelta(it.current, delta);
      write((b) => {
        changeCurrent(b, itemId, delta);
        b.set(doc(entriesCol(itemId)), { amount: delta, date: todayStr(), note, type: 'adjust', createdAt: serverTimestamp() });
      });
    },
    setArchived(itemId, archived) {
      write((b) => b.update(itemRef(itemId), { archived, updatedAt: serverTimestamp() }));
    },
    async deleteItem(itemId) {
      const s = await getDocs(entriesCol(itemId));
      writeChunked([...s.docs.map((d) => (b) => b.delete(d.ref)), (b) => b.delete(itemRef(itemId))]);
    },
    renameTag(categoryId, oldTag, newTag) {
      const tag = normalizeTag(newTag);
      const targets = latest.items.filter((i) => i.categoryId === categoryId && i.tag === oldTag);
      writeChunked(targets.map((i) => (b) => b.update(itemRef(i.id), { tag, updatedAt: serverTimestamp() })));
    },
    addEntry(itemId, { amount, date, note = '' }) {
      assertAmount(amount);
      applyDelta(findItem(itemId).current, amount);
      const ref = doc(entriesCol(itemId));
      write((b) => {
        changeCurrent(b, itemId, amount);
        b.set(ref, { amount, date, note, type: entryType(amount), createdAt: serverTimestamp() });
      });
      return ref.id;
    },
    updateEntry(itemId, entry, { amount, date, note = '' }) {
      assertAmount(amount);
      const delta = roundNum(amount - entry.amount);
      applyDelta(findItem(itemId).current, delta);
      write((b) => {
        changeCurrent(b, itemId, delta);
        b.update(doc(entriesCol(itemId), entry.id), {
          amount, date, note, type: entry.type === 'adjust' ? 'adjust' : entryType(amount),
        });
      });
    },
    deleteEntry(itemId, entry) {
      applyDelta(findItem(itemId).current, -entry.amount);
      write((b) => {
        changeCurrent(b, itemId, -entry.amount);
        b.delete(doc(entriesCol(itemId), entry.id));
      });
    },
  };
}
