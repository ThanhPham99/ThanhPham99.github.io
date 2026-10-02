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

// Achieved goals switch to the success colour so "done" reads at a glance, not only via the label.
const DONE = '#10b981';

export function ring(pct, color, size = 56, { track = null, label = formatPct(pct) } = {}) {
  const stroke = size >= 100 ? 10 : size >= 80 ? 8 : 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const shown = Math.min(Math.max(pct ?? 0, 0), 1);
  const root = svg('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, class: '-rotate-90', 'aria-hidden': 'true' });
  root.append(
    svg('circle', track
      ? { cx: size / 2, cy: size / 2, r, fill: 'none', 'stroke-width': stroke, stroke: track }
      : { cx: size / 2, cy: size / 2, r, fill: 'none', 'stroke-width': stroke, class: 'stroke-slate-200 dark:stroke-slate-700/70' }),
    svg('circle', {
      cx: size / 2, cy: size / 2, r, fill: 'none', 'stroke-width': stroke, stroke: track ? color : (shown >= 1 ? DONE : color),
      'stroke-linecap': 'round', 'stroke-dasharray': c, 'stroke-dashoffset': c * (1 - shown), class: 'progress-anim',
    }),
  );
  const text = size >= 100 ? 'text-2xl' : size >= 80 ? 'text-lg' : 'text-xs';
  return h('div', { class: 'relative shrink-0', style: { width: `${size}px`, height: `${size}px` }, role: 'img', 'aria-label': label },
    root,
    h('span', { class: `absolute inset-0 flex items-center justify-center font-bold tabular-nums ${text}`, 'aria-hidden': 'true' }, label));
}

export function bar(pct, color, { size = 'sm' } = {}) {
  const width = Math.min(Math.max(pct ?? 0, 0), 1) * 100;
  return h('div', { class: `${size === 'lg' ? 'h-3' : 'h-2'} w-full rounded-full bg-slate-200/80 dark:bg-slate-700/60 overflow-hidden`, 'aria-hidden': 'true' },
    h('div', { class: 'h-full rounded-full progress-anim', style: { width: `${width}%`, background: width >= 100 ? DONE : color } }));
}

// Bullet bar: actual progress plus a marker where the goal should be today (linear plan to the deadline).
export function bulletBar(pct, expected, color) {
  const clamp = (v) => Math.min(Math.max(v ?? 0, 0), 1) * 100;
  return h('div', { class: 'relative pt-1', 'aria-hidden': 'true' },
    bar(pct, color, { size: 'lg' }),
    expected == null ? null : h('div', {
      class: 'absolute top-0 bottom-[-4px] w-0.5 rounded-full bg-slate-900 dark:bg-white',
      style: { left: `calc(${clamp(expected)}% - 1px)` },
    }));
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
