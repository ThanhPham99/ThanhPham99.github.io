// Overview: hero summary, attention list, average-progress trend, collapsible per-category goal sections.
import { activeCategories, activeItems, averageProgress, formatDate, formatShortDate, formatPct, groupCategoryItems, itemStatus, overviewKpis, todayStr } from '../domain.js';
import { createEntryCache } from '../entry-cache.js';
import { averageSeries } from '../history.js';
import { getLang, t } from '../i18n.js';
import { colorHex } from '../presets.js';
import { isHidden, setHidden } from '../privacy.js';
import { lineChart } from './charts.js';
import { groupCard } from './categories.js';
import { catIcon, emptyState, h, icon, showError } from './dom.js';
import { openCategoryForm } from './forms.js';
import { itemCard } from './item-card.js';
import { openItemDetail } from './item-detail.js';
import { bar, deadlineText, ring, statusBadge } from './progress.js';

const collapsedCategories = new Set();
// Entries are read per item and cached by the item's updatedAt/current, so a change re-reads only that item.
const trend = { key: null, points: null, chart: null, canvas: null, box: null };
let entryCache = null;
let cacheStore = null;

const section = (title, body, extra = null) => h('section', { class: 'space-y-3 min-w-0', 'data-section': title },
  h('div', { class: 'flex items-baseline justify-between gap-3' }, h('h2', { class: 'section-title' }, title), extra),
  body);

const heroChip = (iconName, text) => h('span', { class: 'inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white' },
  icon(iconName, 'w-4 h-4'), text);

function hero(kpi, attention, dueSoon) {
  const hidden = isHidden();
  return h('section', { class: 'hero relative rounded-3xl p-5 sm:p-7 text-white flex items-center gap-5 sm:gap-8 shadow-lg shadow-brand-900/10', 'data-hero': 'true' },
    h('button', {
      type: 'button', class: 'absolute top-2 right-2 inline-flex items-center justify-center w-11 h-11 rounded-xl text-white/90 hover:bg-white/15 transition-colors',
      'aria-pressed': String(hidden), 'aria-label': t(hidden ? 'privacy.show' : 'privacy.hide'), title: t(hidden ? 'privacy.show' : 'privacy.hide'),
      onclick: () => setHidden(!hidden),
    }, icon(hidden ? 'eye-off' : 'eye', 'w-5 h-5')),
    ring(kpi.avg ?? 0, '#ffffff', 112, { track: 'rgba(255,255,255,0.22)', label: formatPct(kpi.avg) }),
    h('div', { class: 'min-w-0 space-y-3 pr-8' },
      h('div', { class: 'space-y-1' },
        h('p', { class: 'text-sm font-medium text-white/90' }, t('kpi.avg')),
        h('p', { class: 'text-xl sm:text-2xl font-extrabold leading-tight', 'data-achieved': 'true' }, t('overview.achievedOf', { a: kpi.achieved, n: kpi.total }))),
      h('div', { class: 'flex flex-wrap gap-2' },
        attention ? heroChip('triangle-alert', t('overview.attentionCount', { n: attention })) : null,
        dueSoon ? heroChip('clock', t('overview.dueSoonCount', { n: dueSoon })) : null,
        !attention && !dueSoon ? heroChip('circle-check', t('overview.allOnTrack')) : null)));
}

// Overdue first, then behind, then due soon; ties by nearest deadline.
const urgency = (st) => (st.overdue ? 0 : st.behind ? 1 : 2);

function attentionList(ctx, rows) {
  return h('div', { class: 'card p-1.5 space-y-0.5' }, rows.map(({ item, st }) => {
    const cat = ctx.state.categories.find((c) => c.id === item.categoryId);
    return h('button', {
      type: 'button', class: 'w-full flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors',
      onclick: () => openItemDetail(ctx, item.id),
    },
    catIcon(cat),
    h('div', { class: 'flex-1 min-w-0 space-y-1.5' },
      h('div', { class: 'flex items-center justify-between gap-2' },
        h('p', { class: 'font-semibold truncate attention-name' }, item.name),
        statusBadge(st)),
      bar(st.pct, colorHex(cat?.color)),
      h('p', { class: 'text-xs muted truncate' }, `${formatPct(st.pct)} · ${deadlineText(st)}`)));
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
  return h('div', { class: 'card p-0 min-w-0', 'data-category-section': cat.id },
    h('button', {
      type: 'button', 'aria-expanded': String(open), onclick: toggle,
      class: `w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 ${open ? 'rounded-t-2xl' : 'rounded-2xl'}`,
    },
    catIcon(cat),
    h('div', { class: 'flex-1 min-w-0 space-y-1.5' },
      h('div', { class: 'flex items-center justify-between gap-2' },
        h('p', { class: 'font-semibold truncate' }, cat.name),
        h('span', { class: 'text-base font-bold tabular-nums' }, formatPct(avg))),
      bar(avg, colorHex(cat.color)),
      h('p', { class: 'text-xs muted' }, t('category.count', { n: items.length }))),
    icon(open ? 'chevron-up' : 'chevron-down', 'w-5 h-5 shrink-0 muted')),
    open
      ? h('div', { class: 'border-t border-slate-100 dark:border-slate-800 p-3 sm:p-4' },
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
  trend.chart = lineChart(trend.canvas, trend.points.map((p) => ({ label: formatShortDate(p.date, lang), title: formatDate(p.date, lang), value: p.avg })), { color: '#10b981', percent: true });
}

export function renderOverview(ctx) {
  trend.chart?.destroy();
  trend.chart = null;
  const categories = activeCategories(ctx.state);
  if (!categories.length) {
    return emptyState('vault', t('overview.welcome'),
      h('button', { type: 'button', class: 'btn btn-primary', onclick: () => openCategoryForm(ctx) }, icon('plus', 'w-4 h-4'), t('category.new')));
  }
  const today = todayStr();
  const active = activeItems(ctx.state);
  const kpi = overviewKpis(active, today);
  const rows = active.map((item) => ({ item, st: itemStatus(item, today) }));
  const attention = rows
    .filter((r) => r.st.overdue || r.st.behind || r.st.dueSoon)
    .sort((a, b) => urgency(a.st) - urgency(b.st) || a.st.daysLeft - b.st.daysLeft);
  trend.canvas = h('canvas', { 'aria-label': t('overview.trend') });
  trend.box = h('div', { class: 'h-52' }, trend.canvas);

  const node = h('div', { class: 'space-y-7' },
    hero(kpi, rows.filter((r) => r.st.behind || r.st.overdue).length, rows.filter((r) => r.st.dueSoon).length),
    h('div', { class: `grid gap-7 ${attention.length ? 'lg:grid-cols-2' : ''}` },
      attention.length ? section(t('overview.attention'), attentionList(ctx, attention)) : null,
      section(t('overview.trend'), h('div', { class: 'card' }, trend.box))),
    section(t('overview.allGoals'), h('div', { class: 'space-y-3' }, categories.map((c) => categorySection(ctx, c, active)))));

  queueMicrotask(() => drawTrend(ctx, active, today));
  return node;
}
