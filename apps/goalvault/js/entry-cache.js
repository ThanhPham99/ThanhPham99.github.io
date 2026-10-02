// Per-item entry cache for the overview trend: every entry write also bumps the item's updatedAt/current,
// so an item whose key is unchanged still has the same entries and needs no new read.
export function createEntryCache(fetchEntries) {
  const cache = new Map(); // itemId -> { key, promise }
  const keyOf = (item) => `${item.updatedAt}:${item.current}`;

  function entriesFor(item) {
    const key = keyOf(item);
    const hit = cache.get(item.id);
    if (hit && hit.key === key) return hit.promise;
    const promise = fetchEntries(item.id);
    cache.set(item.id, { key, promise });
    promise.catch(() => { if (cache.get(item.id)?.promise === promise) cache.delete(item.id); });
    return promise;
  }

  return {
    async rowsFor(items) {
      return Promise.all(items.map(async (item) => ({ item, entries: await entriesFor(item) })));
    },
  };
}
