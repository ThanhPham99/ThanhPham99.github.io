// Detects browser extensions (uBlock, AdGuard, Brave Shields…) that block Firestore's channel requests
// with ERR_BLOCKED_BY_CLIENT. Firestore then silently stays "offline": writes live only in this browser.
const PROBE_URL = 'https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?probe=goalvault';

export async function isFirestoreBlocked({
  fetch = globalThis.fetch,
  online = globalThis.navigator?.onLine ?? true,
  timeoutMs = 5000,
} = {}) {
  if (!online) return false;
  const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), timeoutMs));
  try {
    // no-cors: any server answer resolves as an opaque response; only a client-side block (or no network) rejects.
    await Promise.race([fetch(PROBE_URL, { mode: 'no-cors', cache: 'no-store' }), timeout]);
    return false;
  } catch {
    return true;
  }
}
