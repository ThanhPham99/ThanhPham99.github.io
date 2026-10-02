// Categories list (drag to reorder) and category detail (tag groups + standalone goals).
import { averageProgress, formatPct, groupCategoryItems, normalizeTag } from '../domain.js';
import { t } from '../i18n.js';
import { colorHex } from '../presets.js';
import { routeHref } from '../route.js';
import { catIcon, confirmDialog, emptyState, h, icon, iconButton, safely } from './dom.js';
import { openCategoryForm, openItemForm, promptText } from './forms.js';
import { itemCard } from './item-card.js';
import { bar } from './progress.js';

const collapsed = new Set();
const activeItemsOf = (ctx, categoryId) => ctx.state.items.filter((i) => i.categoryId === categoryId && !i.archived);

async function deleteCategory(ctx, cat) {
  const n = ctx.state.items.filter((i) => i.categoryId === cat.id).length;
  const ok = await confirmDialog(t('category.deleteConfirm', { name: cat.name, n }), { danger: true, okLabel: t('common.delete') });
  if (!ok) return;
  if (ctx.route.name === 'category') location.hash = routeHref('categories');
  await safely(() => ctx.store.deleteCategory(cat.id));
}

function categoryRow(ctx, cat) {
  const items = activeItemsOf(ctx, cat.id);
  const avg = averageProgress(items);
  return h('div', { class: 'card flex items-center gap-2', 'data-id': cat.id },
    h('span', { class: 'drag-handle cursor-grab touch-none text-slate-400 -ml-1 p-1', title: t('category.dragHint') }, icon('grip-vertical', 'w-4 h-4')),
    h('a', { href: routeHref('category', cat.id), class: 'flex-1 min-w-0 flex items-center gap-3' },
      catIcon(cat),
      h('div', { class: 'flex-1 min-w-0 space-y-1.5' },
        h('div', { class: 'flex items-center justify-between gap-2' },
          h('p', { class: 'font-semibold truncate' }, cat.name),
          h('span', { class: 'text-sm font-semibold tabular-nums' }, formatPct(avg))),
        bar(avg, colorHex(cat.color)),
        h('p', { class: 'text-xs text-slate-500 dark:text-slate-400' }, t('category.count', { n: items.length })))),
    iconButton('pencil', () => openCategoryForm(ctx, cat), t('common.edit')),
    iconButton('trash-2', () => deleteCategory(ctx, cat), t('common.delete')));
}

export function renderCategories(ctx) {
  const { categories } = ctx.state;
  const list = h('div', { class: 'space-y-3' }, categories.map((c) => categoryRow(ctx, c)));
  if (window.Sortable && categories.length > 1) {
    window.Sortable.create(list, {
      handle: '.drag-handle',
      animation: 150,
      onEnd: () => safely(() => ctx.store.reorderCategories([...list.children].map((el) => el.dataset.id))),
    });
  }
  return h('section', { class: 'space-y-4' },
    h('div', { class: 'flex items-center justify-between gap-3' },
      h('h1', { class: 'text-xl font-bold' }, t('nav.categories')),
      h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => openCategoryForm(ctx) }, icon('plus', 'w-4 h-4'), t('category.new'))),
    categories.length ? list : emptyState('folder', t('category.empty')));
}

async function renameTag(ctx, cat, tag) {
  const next = await promptText({ title: t('tag.rename'), label: t('item.tag'), value: tag });
  if (next == null || normalizeTag(next) === tag) return;
  await safely(() => ctx.store.renameTag(cat.id, tag, next));
}

export function groupCard(ctx, cat, row) {
  const key = `${cat.id}:${row.tag}`;
  const open = !collapsed.has(key);
  const toggle = () => {
    if (open) collapsed.add(key);
    else collapsed.delete(key);
    ctx.render();
  };
  return h('div', { class: 'card md:col-span-2 space-y-3 bg-slate-50/60 dark:bg-slate-900/60' },
    h('div', { class: 'flex items-center gap-2' },
      h('button', { type: 'button', class: 'flex-1 min-w-0 flex items-center gap-2 text-left', onclick: toggle },
        icon(open ? 'chevron-down' : 'chevron-right', 'w-4 h-4 text-slate-400'),
        icon('tag', 'w-4 h-4 text-slate-400'),
        h('span', { class: 'font-semibold truncate' }, row.tag),
        h('span', { class: 'chip bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300' }, String(row.items.length))),
      h('span', { class: 'text-sm font-semibold tabular-nums' }, formatPct(row.avg)),
      iconButton('pencil', () => renameTag(ctx, cat, row.tag), t('tag.rename'))),
    bar(row.avg, colorHex(cat.color)),
    open ? h('div', { class: 'grid gap-3 md:grid-cols-2' }, row.items.map((item) => itemCard(ctx, item))) : null);
}

export function renderCategoryDetail(ctx, categoryId) {
  const cat = ctx.state.categories.find((c) => c.id === categoryId);
  if (!cat) {
    queueMicrotask(() => { location.hash = routeHref('categories'); });
    return h('div');
  }
  const items = activeItemsOf(ctx, cat.id);
  const rows = groupCategoryItems(items);
  return h('section', { class: 'space-y-4' },
    h('a', { href: routeHref('categories'), class: 'inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600' },
      icon('arrow-left', 'w-4 h-4'), t('nav.categories')),
    h('div', { class: 'flex items-center gap-3' },
      catIcon(cat),
      h('div', { class: 'flex-1 min-w-0' },
        h('h1', { class: 'text-xl font-bold truncate' }, cat.name),
        h('p', { class: 'text-sm text-slate-500 dark:text-slate-400' }, `${t('category.count', { n: items.length })} · ${formatPct(averageProgress(items))}`)),
      iconButton('pencil', () => openCategoryForm(ctx, cat), t('common.edit')),
      iconButton('trash-2', () => deleteCategory(ctx, cat), t('common.delete'))),
    bar(averageProgress(items), colorHex(cat.color)),
    h('button', { type: 'button', class: 'btn btn-primary w-full sm:w-auto', onclick: () => openItemForm(ctx, { categoryId: cat.id }) },
      icon('plus', 'w-4 h-4'), t('item.new')),
    rows.length
      ? h('div', { class: 'grid gap-3 md:grid-cols-2' }, rows.map((row) => (row.type === 'group' ? groupCard(ctx, cat, row) : itemCard(ctx, row.item))))
      : emptyState('target', t('item.empty')));
}
