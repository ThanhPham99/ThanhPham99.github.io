// Local conversion history store (capped at 20 recent conversions, persisted in localStorage).

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

    add({ rawInput, outputText, label, convertedCount, firstAffiliateUrl, isSingleBareLink, createdAt = Date.now() }) {
      const trimmedOutput = String(outputText || '').trim();
      if (!trimmedOutput || !convertedCount) return readAll();

      const existing = readAll().filter((entry) => entry.outputText !== trimmedOutput);
      const id = `${createdAt.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      const entry = {
        id,
        rawInput: String(rawInput || '').trim(),
        outputText: trimmedOutput,
        label: label || (convertedCount > 1 ? `${convertedCount} liên kết Shopee` : 'Liên kết Shopee'),
        convertedCount,
        firstAffiliateUrl: firstAffiliateUrl || null,
        isSingleBareLink: Boolean(isSingleBareLink),
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
