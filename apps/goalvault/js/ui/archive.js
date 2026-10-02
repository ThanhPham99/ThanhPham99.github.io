// Archived categories: hidden (with all their goals) from the overview and categories tab; restorable or deletable.
import { averageProgress, formatPct } from '../domain.js';
import { t } from '../i18n.js';
import { colorHex } from '../presets.js';
import { routeHref } from '../route.js';
import { deleteCategory, itemsOf, setCategoryArchived } from './categories.js';
import { catIcon, emptyState, h, iconButton } from './dom.js';
import { bar } from './progress.js';

export function renderArchive(ctx) {
  const categories = ctx.state.categories.filter((c) => c.archived);
  const title = t('archive.categories');
  return h('section', { class: 'space-y-4' },
    h('h1', { class: 'text-xl font-bold' }, t('archive.title')),
    categories.length
      ? h('section', { class: 'space-y-3', 'data-section': title },
        h('p', { class: 'text-sm muted' }, t('archive.hint')),
        h('div', { class: 'space-y-3' }, categories.map((cat) => {
          const items = itemsOf(ctx, cat.id);
          const avg = averageProgress(items);
          return h('div', { class: 'card flex items-center gap-1' },
            h('a', { href: routeHref('category', cat.id), class: 'flex-1 min-w-0 flex items-center gap-3' },
              catIcon(cat),
              h('div', { class: 'flex-1 min-w-0 space-y-1.5' },
                h('div', { class: 'flex items-center justify-between gap-2' },
                  h('p', { class: 'font-semibold truncate' }, cat.name),
                  h('span', { class: 'text-sm font-semibold tabular-nums' }, formatPct(avg))),
                bar(avg, colorHex(cat.color)),
                h('p', { class: 'text-xs muted' }, t('category.count', { n: items.length })))),
            iconButton('archive-restore', () => setCategoryArchived(ctx, cat, false), t('common.restore')),
            iconButton('trash-2', () => deleteCategory(ctx, cat), t('common.delete')));
        })))
      : emptyState('archive', t('archive.empty')));
}
