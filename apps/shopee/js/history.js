// Local Recent Items store (capped at 20 recent items, persisted in localStorage).

const STORAGE_KEY = 'shopee_aff.history.v1';
export const MAX_HISTORY_ITEMS = 20;

export function createHistoryStore(storage = globalThis.localStorage) {
  function readAll() {
    if (!storage) return [];
    try {
      const raw = storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeAll(entries) {
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore quota / private browsing errors gracefully
    }
  }

  return {
    list() {
      return readAll();
    },

    add({
      rawInput,
      outputText,
      label,
      convertedCount,
      firstAffiliateUrl,
      isSingleBareLink,
      isSingleItem,
      createdAt = Date.now(),
    }) {
      const trimmedOutput = String(outputText || '').trim();
      if (!trimmedOutput || !convertedCount) return readAll();

      const dedupeKey = firstAffiliateUrl && (isSingleItem || convertedCount === 1) ? firstAffiliateUrl : trimmedOutput;
      const existing = readAll().filter((entry) => {
        const prevKey =
          entry.firstAffiliateUrl && (entry.isSingleItem || entry.convertedCount === 1)
            ? entry.firstAffiliateUrl
            : entry.outputText;
        return prevKey !== dedupeKey;
      });

      const id = `${createdAt.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const entry = {
        id,
        rawInput: String(rawInput || '').trim(),
        outputText: trimmedOutput,
        label: label || (convertedCount > 1 ? `${convertedCount} món trên Shopee` : 'Món hàng trên Shopee'),
        convertedCount,
        firstAffiliateUrl: firstAffiliateUrl || null,
        isSingleBareLink: Boolean(isSingleBareLink),
        isSingleItem: isSingleItem !== undefined ? Boolean(isSingleItem) : convertedCount === 1,
        createdAt,
      };

      const next = [entry, ...existing].slice(0, MAX_HISTORY_ITEMS);
      writeAll(next);
      return next;
    },

    remove(id) {
      const next = readAll().filter((entry) => entry.id !== id);
      writeAll(next);
      return next;
    },

    clear() {
      writeAll([]);
      return [];
    },
  };
}
