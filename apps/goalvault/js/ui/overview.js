// Overview: KPIs, per-category progress, average-progress trend, due-soon / attention lists, filterable goal grid.
import { averageProgress, formatDate, formatPct, groupCategoryItems, itemStatus, overviewKpis, todayStr } from '../domain.js';
import { createEntryCache } from '../entry-cache.js';
import { averageSeries } from '../history.js';
import { getLang, t } from '../i18n.js';
import { colorHex } from '../presets.js';
import { routeHref } from '../route.js';
import { lineChart } from './charts.js';
import { groupCard } from './categories.js';
import { catIcon, emptyState, h, icon, showError } from './dom.js';
import { openCategoryForm } from './forms.js';
import { itemCard } from './item-card.js';
import { openItemDetail } from './item-detail.js';
import { bar, deadlineText, statusBadge } from './progress.js';

const collapsedCategories = new Set();
// Entries are read per item and cached by the item's updatedAt/current, so a change re-reads only that item.
const trend = { key: null, points: null, chart: null, canvas: null, box: null };
let entryCache = null;
let cacheStore = null;

const section = (title, body) => h('section', { class: 'space-y-3' }, h('h2', { class: 'font-bold' }, title), body);

function kpiCard(iconName, value, label, tone = 'text-brand-600 dark:text-brand-400') {
  return h('div', { class: 'card p-3 sm:p-4 space-y-1' },
    h('span', { class: tone }, icon(iconName, 'w-5 h-5')),
    h('p', { class: 'text-xl sm:text-2xl font-extrabold tabular-nums' }, value),
    h('p', { class: 'text-xs text-slate-500 dark:text-slate-400 leading-tight' }, label));
}

function categoryProgress(cat, active) {
  const avg = averageProgress(active.filter((i) => i.categoryId === cat.id));
  return h('a', { href: routeHref('category', cat.id), class: 'block space-y-1.5 group' },
    h('div', { class: 'flex items-center gap-2' },
      catIcon(cat, 'sm'),
      h('span', { class: 'flex-1 min-w-0 truncate font-medium group-hover:text-brand-600' }, cat.name),
      h('span', { class: 'text-sm font-semibold tabular-nums' }, formatPct(avg))),
    bar(avg, colorHex(cat.color)));
}

function compactList(ctx, rows) {
  if (!rows.length) return h('div', { class: 'card text-sm text-slate-500 dark:text-slate-400' }, t('overview.nothing'));
  return h('div', { class: 'card p-0 divide-y divide-slate-100 dark:divide-slate-800' }, rows.map(({ item, st }) => {
    const cat = ctx.state.categories.find((c) => c.id === item.categoryId);
    return h('button', { type: 'button', class: 'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 first:rounded-t-2xl last:rounded-b-2xl', onclick: () => openItemDetail(ctx, item.id) },
      catIcon(cat, 'sm'),
      h('div', { class: 'flex-1 min-w-0' },
        h('p', { class: 'font-medium truncate' }, item.name),
        h('p', { class: 'text-xs text-slate-500 dark:text-slate-400 truncate' }, `${formatPct(st.pct)} · ${deadlineText(st)}`)),
      statusBadge(st));
  }));
}

// One collapsible section per category; inside, goals sharing a tag form a group (as on the category page).
function categorySection(ctx, cat, active) {
  const items = active.filter((i) => i.categoryId === cat.id);
  const rows = groupCategoryItems(items);
  const open = !collapsedCategories.has(cat.id);
  const avg = averageProgress(items);
  const toggle = () => {
    if (open) collapsedCategories.add(cat.id);
    else collapsedCategories.delete(cat.id);
    ctx.render();
  };
  return h('div', { class: 'card p-0' },
    h('button', {
      type: 'button', 'aria-expanded': String(open), onclick: toggle,
      class: `w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 ${open ? 'rounded-t-2xl' : 'rounded-2xl'}`,
    },
    icon(open ? 'chevron-down' : 'chevron-right', 'w-4 h-4 shrink-0 text-slate-400'),
    catIcon(cat),
    h('div', { class: 'flex-1 min-w-0 space-y-1.5' },
      h('div', { class: 'flex items-center justify-between gap-2' },
        h('p', { class: 'font-semibold truncate' }, cat.name),
        h('span', { class: 'text-sm font-semibold tabular-nums' }, formatPct(avg))),
      bar(avg, colorHex(cat.color)),
      h('p', { class: 'text-xs text-slate-500 dark:text-slate-400' }, t('category.count', { n: items.length })))),
    open
      ? h('div', { class: 'border-t border-slate-100 dark:border-slate-800 p-4' },
        rows.length
          ? h('div', { class: 'grid gap-3 md:grid-cols-2' }, rows.map((row) => (row.type === 'group' ? groupCard(ctx, cat, row) : itemCard(ctx, row.item))))
          : h('p', { class: 'text-sm text-slate-500 dark:text-slate-400' }, t('item.empty')))
      : null);
}

async function drawTrend(ctx, active, today) {
  if (cacheStore !== ctx.store) {
    cacheStore = ctx.store;
    entryCache = createEntryCache((id) => ctx.store.listEntries(id));
  }
  const key = `${today}|${active.map((i) => `${i.id}:${i.current}:${i.target}:${i.updatedAt}`).join(',')}`;
  if (trend.key !== key) {
    trend.key = key;
    trend.points = null;
    try {
      const rows = await entryCache.rowsFor(active);
      if (trend.key !== key) return;
      trend.points = averageSeries(rows, today);
    } catch (err) {
      showError(err);
      return;
    }
  }
  if (!trend.points || !trend.canvas?.isConnected) return;
  trend.chart?.destroy();
  trend.chart = null;
  if (trend.points.length < 2) {
    trend.box.replaceChildren(h('p', { class: 'h-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400' }, t('overview.noTrend')));
    return;
  }
  const lang = getLang();
  trend.chart = lineChart(trend.canvas, trend.points.map((p) => ({ label: formatDate(p.date, lang), value: p.avg })), { color: '#10b981', percent: true });
}

export function renderOverview(ctx) {
  trend.chart?.destroy();
  trend.chart = null;
  const { categories, items } = ctx.state;
  if (!categories.length) {
    return emptyState('vault', t('overview.welcome'),
      h('button', { type: 'button', class: 'btn btn-primary', onclick: () => openCategoryForm(ctx) }, icon('plus', 'w-4 h-4'), t('category.new')));
  }
  const today = todayStr();
  const active = items.filter((i) => !i.archived);
  const kpi = overviewKpis(active, today);
  const rows = active.map((item) => ({ item, st: itemStatus(item, today) }));
  const byDeadline = (a, b) => a.item.deadline.localeCompare(b.item.deadline);
  trend.canvas = h('canvas');
  trend.box = h('div', { class: 'h-48' }, trend.canvas);

  const node = h('div', { class: 'space-y-6' },
    h('div', { class: 'grid grid-cols-3 gap-3' },
      kpiCard('gauge', formatPct(kpi.avg), t('kpi.avg')),
      kpiCard('circle-check', `${kpi.achieved}/${kpi.total}`, t('kpi.achieved'), 'text-emerald-500'),
      kpiCard('triangle-alert', String(kpi.behind), t('kpi.behind'), kpi.behind ? 'text-amber-500' : 'text-slate-400')),
    h('div', { class: 'grid gap-6 lg:grid-cols-2' },
      section(t('overview.byCategory'), h('div', { class: 'card space-y-4' }, categories.map((c) => categoryProgress(c, active)))),
      section(t('overview.trend'), h('div', { class: 'card' }, trend.box))),
    h('div', { class: 'grid gap-6 lg:grid-cols-2' },
      section(t('overview.dueSoon'), compactList(ctx, rows.filter((r) => r.st.dueSoon).sort(byDeadline))),
      section(t('overview.attention'), compactList(ctx, rows.filter((r) => r.st.behind || r.st.overdue).sort(byDeadline)))),
    section(t('overview.allGoals'), h('div', { class: 'space-y-3' }, categories.map((c) => categorySection(ctx, c, active)))));

  queueMicrotask(() => drawTrend(ctx, active, today));
  return node;
}
