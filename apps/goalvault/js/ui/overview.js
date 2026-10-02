// Overview: KPIs, per-category progress, average-progress trend, due-soon / attention lists, filterable goal grid.
import { averageProgress, formatDate, formatPct, itemStatus, overviewKpis, progress, tagsOf, todayStr } from '../domain.js';
import { averageSeries } from '../history.js';
import { getLang, t } from '../i18n.js';
import { colorHex } from '../presets.js';
import { routeHref } from '../route.js';
import { lineChart } from './charts.js';
import { catIcon, emptyState, h, icon, showError } from './dom.js';
import { openCategoryForm } from './forms.js';
import { itemCard } from './item-card.js';
import { openItemDetail } from './item-detail.js';
import { bar, deadlineText, statusBadge } from './progress.js';

const filters = { categoryId: '', tag: '' };
// Entries are fetched per item, so the trend is cached until any goal's value/target changes.
const trend = { key: null, points: null, chart: null, canvas: null, box: null };

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

function filterBar(ctx, categories, active) {
  if (filters.categoryId && !categories.some((c) => c.id === filters.categoryId)) filters.categoryId = '';
  const tags = filters.categoryId ? tagsOf(active.filter((i) => i.categoryId === filters.categoryId)) : [];
  if (filters.tag && !tags.includes(filters.tag)) filters.tag = '';
  const select = (value, options, onchange, disabled = false) => h('select', { class: 'input', disabled, onchange },
    options.map(([v, label]) => h('option', { value: v, selected: v === value }, label)));
  return h('div', { class: 'grid grid-cols-2 gap-3' },
    select(filters.categoryId, [['', t('overview.allCategories')], ...categories.map((c) => [c.id, c.name])], (e) => {
      filters.categoryId = e.target.value;
      filters.tag = '';
      ctx.render();
    }),
    select(filters.tag, [['', t('overview.allTags')], ...tags.map((tag) => [tag, tag])], (e) => {
      filters.tag = e.target.value;
      ctx.render();
    }, !filters.categoryId));
}

function goalsGrid(ctx, active) {
  const shown = active
    .filter((i) => !filters.categoryId || i.categoryId === filters.categoryId)
    .filter((i) => !filters.tag || i.tag === filters.tag)
    .sort((a, b) => Math.min(progress(a), 1) - Math.min(progress(b), 1));
  if (!shown.length) return h('div', { class: 'card text-sm text-slate-500 dark:text-slate-400' }, t('overview.noMatch'));
  return h('div', { class: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' }, shown.map((item) => itemCard(ctx, item, { showCategory: true })));
}

async function drawTrend(ctx, active, today) {
  const key = `${today}|${active.map((i) => `${i.id}:${i.current}:${i.target}`).join(',')}`;
  if (trend.key !== key) {
    trend.key = key;
    trend.points = null;
    try {
      const rows = await Promise.all(active.map(async (item) => ({ item, entries: await ctx.store.listEntries(item.id) })));
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
    section(t('overview.allGoals'), h('div', { class: 'space-y-3' }, filterBar(ctx, categories, active), goalsGrid(ctx, active))));

  queueMicrotask(() => drawTrend(ctx, active, today));
  return node;
}
