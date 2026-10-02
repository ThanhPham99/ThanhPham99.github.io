// Categories list (drag to reorder) and category detail (tag groups + standalone goals).
import { activeCategories, averageProgress, formatPct, groupCategoryItems, normalizeTag } from '../domain.js';
import { t } from '../i18n.js';
import { colorHex } from '../presets.js';
import { routeHref } from '../route.js';
import { actionSheet, catIcon, confirmDialog, emptyState, h, icon, iconButton, safely } from './dom.js';
import { openCategoryForm, openItemForm, promptText } from './forms.js';
import { itemCard } from './item-card.js';
import { bar } from './progress.js';

const collapsed = new Set();
export const itemsOf = (ctx, categoryId) => ctx.state.items.filter((i) => i.categoryId === categoryId);

export function setCategoryArchived(ctx, cat, archived) {
  return safely(() => ctx.store.setCategoryArchived(cat.id, archived));
}

export async function deleteCategory(ctx, cat) {
  const n = ctx.state.items.filter((i) => i.categoryId === cat.id).length;
  const ok = await confirmDialog(t('category.deleteConfirm', { name: cat.name, n }), { danger: true, okLabel: t('common.delete') });
  if (!ok) return;
  if (ctx.route.name === 'category') location.hash = routeHref('categories');
  await safely(() => ctx.store.deleteCategory(cat.id));
}

function categoryRow(ctx, cat) {
  const items = itemsOf(ctx, cat.id);
  const avg = averageProgress(items);
  return h('div', { class: 'card flex items-center gap-1', 'data-id': cat.id },
    h('span', { class: 'drag-handle cursor-grab touch-none text-slate-400 -ml-1 p-1', title: t('category.dragHint') }, icon('grip-vertical', 'w-4 h-4')),
    h('a', { href: routeHref('category', cat.id), class: 'flex-1 min-w-0 flex items-center gap-3' },
      catIcon(cat),
      h('div', { class: 'flex-1 min-w-0 space-y-1.5' },
        h('div', { class: 'flex items-center justify-between gap-2' },
          h('p', { class: 'font-semibold truncate' }, cat.name),
          h('span', { class: 'text-sm font-semibold tabular-nums' }, formatPct(avg))),
        bar(avg, colorHex(cat.color)),
        h('p', { class: 'text-xs text-slate-500 dark:text-slate-400' }, t('category.count', { n: items.length })))),
    // Inline actions on wider screens; a single "more" button opening a sheet on phones keeps the name readable.
    h('div', { class: 'hidden sm:flex items-center' },
      iconButton('pencil', () => openCategoryForm(ctx, cat), t('common.edit')),
      iconButton('archive', () => setCategoryArchived(ctx, cat, true), t('category.archive')),
      iconButton('trash-2', () => deleteCategory(ctx, cat), t('common.delete'))),
    h('div', { class: 'sm:hidden' },
      iconButton('ellipsis-vertical', () => actionSheet(cat.name, [
        { icon: 'pencil', label: t('common.edit'), onSelect: () => openCategoryForm(ctx, cat) },
        { icon: 'archive', label: t('category.archive'), onSelect: () => setCategoryArchived(ctx, cat, true) },
        { icon: 'trash-2', label: t('common.delete'), onSelect: () => deleteCategory(ctx, cat), danger: true },
      ]), t('common.actions'))));
}

export function renderCategories(ctx) {
  const categories = activeCategories(ctx.state);
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
  return h('div', { class: 'tag-group', 'data-tag-group': row.tag },
    h('div', { class: 'flex items-center gap-2' },
      h('button', { type: 'button', class: 'flex-1 min-w-0 flex items-center gap-2 text-left min-h-11 rounded-xl', 'aria-expanded': String(open), onclick: toggle },
        icon(open ? 'chevron-down' : 'chevron-right', 'w-4 h-4 shrink-0 muted'),
        h('span', { class: 'inline-flex items-center gap-1.5 min-w-0 rounded-lg px-2 py-1 text-sm font-semibold', style: { background: `${colorHex(cat.color)}1f`, color: colorHex(cat.color) } },
          icon('tag', 'w-3.5 h-3.5 shrink-0'),
          h('span', { class: 'truncate tag-name' }, row.tag)),
        h('span', { class: 'chip bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300 tag-count' }, String(row.items.length))),
      iconButton('pencil', () => renameTag(ctx, cat, row.tag), t('tag.rename'))),
    open ? h('div', { class: 'grid gap-3' }, row.items.map((item) => itemCard(ctx, item))) : null);
}

export function renderCategoryDetail(ctx, categoryId) {
  const cat = ctx.state.categories.find((c) => c.id === categoryId);
  if (!cat) {
    queueMicrotask(() => { location.hash = routeHref('categories'); });
    return h('div');
  }
  const items = itemsOf(ctx, cat.id);
  const rows = groupCategoryItems(items);
  const back = cat.archived ? 'archive' : 'categories';
  return h('section', { class: 'space-y-4' },
    h('a', { href: routeHref(back), class: 'inline-flex items-center gap-1 text-sm muted hover:text-brand-600 min-h-11' },
      icon('arrow-left', 'w-4 h-4'), t(`nav.${back}`)),
    cat.archived
      ? h('div', { class: 'flex items-center gap-3 rounded-2xl bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100 p-3 pl-4', 'data-archived-banner': 'true' },
        icon('archive', 'w-5 h-5 shrink-0'),
        h('p', { class: 'flex-1 text-sm font-medium' }, t('category.archivedBanner')),
        h('button', { type: 'button', class: 'btn btn-sm bg-white text-amber-900 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-100', onclick: () => setCategoryArchived(ctx, cat, false) },
          icon('archive-restore', 'w-4 h-4'), t('common.restore')))
      : null,
    h('div', { class: 'flex items-center gap-3' },
      catIcon(cat),
      h('div', { class: 'flex-1 min-w-0' },
        h('h1', { class: 'text-xl font-bold truncate' }, cat.name),
        h('p', { class: 'text-sm text-slate-500 dark:text-slate-400' }, `${t('category.count', { n: items.length })} · ${formatPct(averageProgress(items))}`)),
      iconButton('pencil', () => openCategoryForm(ctx, cat), t('common.edit')),
      cat.archived ? null : iconButton('archive', () => setCategoryArchived(ctx, cat, true), t('category.archive')),
      iconButton('trash-2', () => deleteCategory(ctx, cat), t('common.delete'))),
    bar(averageProgress(items), colorHex(cat.color)),
    h('button', { type: 'button', class: 'btn btn-primary w-full sm:w-auto', onclick: () => openItemForm(ctx, { categoryId: cat.id }) },
      icon('plus', 'w-4 h-4'), t('item.new')),
    rows.length
      ? h('div', { class: 'grid gap-3' }, rows.map((row) => (row.type === 'group' ? groupCard(ctx, cat, row) : itemCard(ctx, row.item))))
      : emptyState('target', t('item.empty')));
}
