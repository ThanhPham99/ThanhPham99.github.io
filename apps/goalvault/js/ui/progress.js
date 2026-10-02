// Progress visuals (SVG ring, bar) and status labels.
import { formatPct } from '../domain.js';
import { t } from '../i18n.js';
import { h } from './dom.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

export function ring(pct, color, size = 56) {
  const stroke = size >= 80 ? 8 : 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const shown = Math.min(Math.max(pct ?? 0, 0), 1);
  const root = svg('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, class: '-rotate-90' });
  root.append(
    svg('circle', { cx: size / 2, cy: size / 2, r, fill: 'none', 'stroke-width': stroke, class: 'stroke-slate-200 dark:stroke-slate-700' }),
    svg('circle', {
      cx: size / 2, cy: size / 2, r, fill: 'none', 'stroke-width': stroke, stroke: color, 'stroke-linecap': 'round',
      'stroke-dasharray': c, 'stroke-dashoffset': c * (1 - shown), class: 'transition-all duration-700',
    }),
  );
  return h('div', { class: 'relative shrink-0', style: { width: `${size}px`, height: `${size}px` } },
    root,
    h('span', { class: `absolute inset-0 flex items-center justify-center font-bold tabular-nums ${size >= 80 ? 'text-lg' : 'text-xs'}` }, formatPct(pct)));
}

export function bar(pct, color) {
  const width = Math.min(Math.max(pct ?? 0, 0), 1) * 100;
  return h('div', { class: 'h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden' },
    h('div', { class: 'h-full rounded-full transition-all duration-700', style: { width: `${width}%`, background: color } }));
}

const BADGE = {
  achieved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  behind: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  dueSoon: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  onTrack: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function statusBadge(status) {
  const cls = BADGE[status.key];
  return cls ? h('span', { class: `chip ${cls}` }, t(`status.${status.key}`)) : null;
}

export function deadlineText(status) {
  if (status.daysLeft == null) return '';
  if (status.daysLeft < 0) return t('item.overdueBy', { n: -status.daysLeft });
  if (status.daysLeft === 0) return t('item.dueToday');
  return t('item.daysLeft', { n: status.daysLeft });
}
