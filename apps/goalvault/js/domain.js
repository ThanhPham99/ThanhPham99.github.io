// Pure domain logic for Goalvault: numbers, dates, progress, statuses, grouping.
export const DUE_SOON_DAYS = 30;
export const BEHIND_MARGIN = 0.1;
export const DAYS_PER_MONTH = 30.4375;

const LOCALES = { vi: 'vi-VN', en: 'en-US' };
const DAY_MS = 86400000;
const clamp = (x, lo, hi) => Math.min(Math.max(x, lo), hi);

export function roundNum(x) {
  return Math.round(x * 1e10) / 1e10;
}

export function formatNumber(n, lang = 'vi') {
  return new Intl.NumberFormat(LOCALES[lang] ?? LOCALES.vi, { maximumFractionDigits: 4 }).format(n);
}

// For prefilling inputs: full precision so an untouched field parses back to the same number.
export function formatInput(n, lang = 'vi') {
  return new Intl.NumberFormat(LOCALES[lang] ?? LOCALES.vi, { maximumFractionDigits: 10 }).format(n);
}

// Accepts "1.000.000", "1,000,000", "1,5", "1.000,5"… in either UI language.
// A single separator that is the language's decimal mark is a decimal; otherwise a separator is a
// thousands separator only when it forms clean 3-digit groups after a non-zero lead.
export function parseNumber(input, lang = 'vi') {
  if (typeof input === 'number') return Number.isFinite(input) ? input : NaN;
  let s = String(input ?? '').replace(/\s/g, '');
  if (!s) return NaN;
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot >= 0 && lastComma >= 0) {
    const dec = lastDot > lastComma ? '.' : ',';
    const grp = dec === '.' ? ',' : '.';
    s = s.split(grp).join('');
    if (s.split(dec).length > 2) return NaN;
    s = s.replace(dec, '.');
  } else if (lastDot >= 0 || lastComma >= 0) {
    const sep = lastDot >= 0 ? '.' : ',';
    const single = s.split(sep).length === 2;
    const grouped = new RegExp(`^-?[1-9]\\d{0,2}(\\${sep}\\d{3})+$`);
    if (single && sep === (lang === 'en' ? '.' : ',')) s = s.replace(sep, '.');
    else if (grouped.test(s)) s = s.split(sep).join('');
    else if (single) s = s.replace(sep, '.');
    else return NaN;
  }
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

export function formatPct(p) {
  if (p == null) return '—';
  const v = p >= 1 ? Math.floor(p * 100) : Math.min(Math.round(p * 100), 99);
  return `${v}%`;
}

export function todayStr(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function msToDateStr(ms) {
  return todayStr(new Date(ms));
}

export function dayNumber(str) {
  const [y, m, d] = str.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

export function isDateStr(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function formatDate(dateStr, lang = 'vi') {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat(LOCALES[lang] ?? LOCALES.vi, { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(y, m - 1, d));
}

// Compact axis label (day/month in the locale's order).
export function formatShortDate(dateStr, lang = 'vi') {
  const [, m, d] = dateStr.split('-');
  return lang === 'en' ? `${m}/${d}` : `${d}/${m}`;
}

export function progress(item) {
  return item.target > 0 ? roundNum(item.current / item.target) : 0;
}

export function averageProgress(items) {
  if (!items.length) return null;
  return items.reduce((sum, it) => sum + Math.min(progress(it), 1), 0) / items.length;
}

export function itemStatus(item, today = todayStr()) {
  const pct = progress(item);
  const res = {
    key: 'noDeadline', pct, remaining: Math.max(roundNum(item.target - item.current), 0),
    achieved: pct >= 1, overdue: false, behind: false, dueSoon: false,
    daysLeft: null, expectedPct: null, perMonth: null,
  };
  if (res.achieved) res.key = 'achieved';
  if (!item.deadline) return res;
  const now = dayNumber(today);
  const end = dayNumber(item.deadline);
  const start = Math.min(dayNumber(msToDateStr(item.createdAt)), end);
  res.daysLeft = end - now;
  res.expectedPct = end > start ? clamp((now - start) / (end - start), 0, 1) : 1;
  if (res.achieved) return res;
  res.overdue = res.daysLeft < 0;
  res.dueSoon = !res.overdue && res.daysLeft <= DUE_SOON_DAYS;
  res.behind = !res.overdue && pct < res.expectedPct - BEHIND_MARGIN;
  res.perMonth = res.overdue ? null : res.remaining / Math.max(res.daysLeft / DAYS_PER_MONTH, 1);
  res.key = res.overdue ? 'overdue' : res.behind ? 'behind' : res.dueSoon ? 'dueSoon' : 'onTrack';
  return res;
}

export function normalizeTag(tag) {
  const s = String(tag ?? '').trim().replace(/\s+/g, ' ');
  return s || null;
}

export function tagsOf(items) {
  return [...new Set(items.map((i) => normalizeTag(i.tag)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

// Items sharing a tag form a group; untagged items stay as standalone rows (never pooled).
export function groupCategoryItems(items) {
  const groups = new Map();
  const singles = [];
  for (const it of items) {
    const tag = normalizeTag(it.tag);
    if (!tag) { singles.push(it); continue; }
    if (!groups.has(tag)) groups.set(tag, []);
    groups.get(tag).push(it);
  }
  const byCreated = (a, b) => a.createdAt - b.createdAt;
  const rows = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, list]) => ({ type: 'group', tag, items: list.sort(byCreated), avg: averageProgress(list) }));
  return rows.concat(singles.sort(byCreated).map((item) => ({ type: 'item', item })));
}

export function validateItemInput({ name, target, current, deadline }) {
  const errors = {};
  if (!String(name ?? '').trim()) errors.name = 'required';
  if (!Number.isFinite(target) || target <= 0) errors.target = 'positive';
  if (!Number.isFinite(current) || current < 0) errors.current = 'nonNegative';
  if (deadline && !isDateStr(deadline)) errors.deadline = 'invalidDate';
  return errors;
}

export function applyDelta(current, delta) {
  const next = roundNum(current + delta);
  if (!Number.isFinite(next)) throw new Error('INVALID_NUMBER');
  if (next < 0) throw new Error('NEGATIVE_CURRENT');
  return next;
}

export function entryType(amount) {
  return amount >= 0 ? 'deposit' : 'withdraw';
}

export function overviewKpis(items, today = todayStr()) {
  const statuses = items.map((i) => itemStatus(i, today));
  return {
    avg: averageProgress(items),
    total: items.length,
    achieved: statuses.filter((s) => s.achieved).length,
    behind: statuses.filter((s) => s.behind || s.overdue).length,
  };
}

// Only whole categories are archived: an archived category hides itself and every goal inside it.
// Goals carry a legacy `archived` flag from an earlier version; it is ignored.
export function activeCategories(state) {
  return state.categories.filter((c) => !c.archived);
}

export function activeItems(state) {
  const archivedCats = new Set(state.categories.filter((c) => c.archived).map((c) => c.id));
  return state.items.filter((i) => !archivedCats.has(i.categoryId));
}
