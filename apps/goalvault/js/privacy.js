// "Hide amounts" mode: every displayed value becomes a fixed-length mask so magnitudes don't leak;
// percentages stay visible. Remembered per device.
import { formatNumber } from './domain.js';

const KEY = 'goalvault.hideAmounts';
export const MASK = '******';
const listeners = new Set();

function readStored() {
  try {
    return globalThis.localStorage?.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

let hidden = readStored();

export const isHidden = () => hidden;

export function setHidden(next) {
  if (next === hidden) return;
  hidden = next;
  try { globalThis.localStorage?.setItem(KEY, next ? '1' : '0'); } catch { /* storage unavailable */ }
  listeners.forEach((cb) => cb(next));
}

export function onPrivacyChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function displayNumber(n, lang, { signed = false } = {}) {
  if (hidden) return MASK;
  return `${signed && n > 0 ? '+' : ''}${formatNumber(n, lang)}`;
}
