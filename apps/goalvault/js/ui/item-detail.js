// Goal detail sheet: progress, stats, history chart, transactions, edit/archive/delete.
import { formatDate, formatNumber, formatShortDate, formatPct, itemStatus, todayStr } from '../domain.js';
import { valueSeries } from '../history.js';
import { getLang, t } from '../i18n.js';
import { colorHex } from '../presets.js';
import { lineChart } from './charts.js';
import { confirmDialog, h, icon, iconButton, modalHeader, openModal, safely, showError } from './dom.js';
import { openEntryForm, openItemForm, openSetCurrent } from './forms.js';
import { bulletBar, deadlineText, ring, statusBadge } from './progress.js';

export function openItemDetail(ctx, itemId) {
  let entries = [];
  let chart = null;
  let wasAchieved = null;
  let unsubEntries = () => {};
  let unsubState = () => {};
  const modal = openModal(() => h('div'));
  modal.onClose(() => {
    unsubEntries();
    unsubState();
    chart?.destroy();
  });

  const setArchived = async (item, archived) => {
    await safely(() => ctx.store.setArchived(item.id, archived));
    modal.close();
  };
  const remove = async (item) => {
    const ok = await confirmDialog(t('item.deleteConfirm', { name: item.name }), { danger: true, okLabel: t('common.delete') });
    if (!ok) return;
    modal.close();
    await safely(() => ctx.store.deleteItem(item.id));
  };
  const removeEntry = async (item, entry) => {
    const ok = await confirmDialog(t('entry.deleteConfirm'), { danger: true, okLabel: t('common.delete') });
    if (ok) await safely(() => ctx.store.deleteEntry(item.id, entry));
  };
  const promptArchive = async (item) => {
    const ok = await confirmDialog(t('item.archivePrompt', { name: item.name }), { okLabel: t('item.archive') });
    if (ok) await setArchived(item, true);
  };

  const statsGrid = (item, st, lang) => {
    const cells = [[t('item.remaining'), formatNumber(st.remaining, lang)]];
    if (item.deadline) {
      cells.push([t('item.deadline'), `${formatDate(item.deadline, lang)} · ${deadlineText(st)}`]);
      if (st.perMonth != null) cells.push([t('item.perMonth'), formatNumber(Math.ceil(st.perMonth * 100) / 100, lang)]);
      cells.push([t('item.expected'), formatPct(st.expectedPct)]);
    }
    return h('div', { class: 'grid grid-cols-2 gap-2' }, cells.map(([label, value]) => h('div', { class: 'rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3' },
      h('p', { class: 'text-xs text-slate-500 dark:text-slate-400' }, label),
      h('p', { class: 'font-semibold tabular-nums break-words' }, value))));
  };

  const entryList = (item, lang) => {
    if (!entries.length) return h('p', { class: 'text-sm text-slate-500 dark:text-slate-400' }, t('item.noEntries'));
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    return h('ul', { class: 'divide-y divide-slate-100 dark:divide-slate-800' }, sorted.map((e) => h('li', { class: 'flex items-center gap-2 py-2' },
      h('div', { class: 'flex-1 min-w-0' },
        h('p', { class: 'text-sm font-medium' }, `${formatDate(e.date, lang)} · ${t(`entry.${e.type}`)}`),
        e.note ? h('p', { class: 'text-xs text-slate-500 dark:text-slate-400 truncate' }, e.note) : null),
      h('span', { class: `font-semibold tabular-nums ${e.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}` },
        `${e.amount > 0 ? '+' : ''}${formatNumber(e.amount, lang)}`),
      iconButton('pencil', () => openEntryForm(ctx, item, e), t('common.edit')),
      iconButton('trash-2', () => removeEntry(item, e), t('common.delete')))));
  };

  const render = () => {
    const item = ctx.state?.items.find((i) => i.id === itemId);
    if (!item) {
      modal.close();
      return;
    }
    chart?.destroy();
    chart = null;
    const cat = ctx.state.categories.find((c) => c.id === item.categoryId);
    const color = colorHex(cat?.color);
    const lang = getLang();
    const st = itemStatus(item, todayStr());
    const canvas = h('canvas');
    modal.setContent(h('div', { class: 'space-y-5' },
      modalHeader(item.name, modal, [cat?.name, item.tag].filter(Boolean).join(' · ')),
      h('div', { class: 'flex items-center gap-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4' },
        ring(st.pct, color, 104),
        h('div', { class: 'min-w-0 space-y-1' },
          h('p', { class: 'text-2xl font-extrabold tabular-nums break-all', 'data-current': 'true' }, formatNumber(item.current, lang)),
          h('p', { class: 'text-sm muted tabular-nums break-all' }, `/ ${formatNumber(item.target, lang)}`),
          statusBadge(st))),
      item.deadline && !st.achieved
        ? h('div', { class: 'space-y-1.5' }, bulletBar(st.pct, st.expectedPct, color), h('p', { class: 'text-xs muted' }, t('item.expectedMarker')))
        : null,
      statsGrid(item, st, lang),
      item.note ? h('p', { class: 'text-sm whitespace-pre-line break-words rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3' }, item.note) : null,
      h('div', { class: 'grid grid-cols-2 gap-2' },
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => openEntryForm(ctx, item) }, icon('arrow-left-right', 'w-4 h-4'), t('item.addEntry')),
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => openSetCurrent(ctx, item) }, icon('pencil-line', 'w-4 h-4'), t('item.setCurrent'))),
      h('div', { class: 'flex flex-wrap gap-2' },
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => openItemForm(ctx, { categoryId: item.categoryId, item }) }, icon('pencil', 'w-4 h-4'), t('common.edit')),
        item.archived
          ? h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => setArchived(item, false) }, icon('archive-restore', 'w-4 h-4'), t('common.restore'))
          : h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => setArchived(item, true) }, icon('archive', 'w-4 h-4'), t('item.archive')),
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm text-rose-600 dark:text-rose-400', onclick: () => remove(item) }, icon('trash-2', 'w-4 h-4'), t('common.delete'))),
      h('div', { class: 'space-y-3' },
        h('h3', { class: 'section-title' }, t('item.history')),
        entries.length ? h('div', { class: 'h-44' }, canvas) : null,
        entryList(item, lang))));
    if (entries.length) {
      chart = lineChart(canvas, valueSeries(entries).map((p) => ({ label: formatShortDate(p.date, lang), title: formatDate(p.date, lang), value: p.value })), { color, target: item.target });
    }
    if (wasAchieved === false && st.achieved && !item.archived) promptArchive(item);
    wasAchieved = st.achieved;
  };

  unsubEntries = ctx.store.subscribeEntries(itemId, (list) => {
    entries = list;
    render();
  }, showError);
  unsubState = ctx.onState(render);
  render();
}
