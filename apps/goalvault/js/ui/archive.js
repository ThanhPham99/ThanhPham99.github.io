// Archived goals: excluded from overview/categories, restorable or permanently deletable.
import { formatNumber, progress } from '../domain.js';
import { getLang, t } from '../i18n.js';
import { colorHex } from '../presets.js';
import { confirmDialog, emptyState, h, iconButton, safely } from './dom.js';
import { openItemDetail } from './item-detail.js';
import { ring } from './progress.js';

async function remove(ctx, item) {
  const ok = await confirmDialog(t('item.deleteConfirm', { name: item.name }), { danger: true, okLabel: t('common.delete') });
  if (ok) await safely(() => ctx.store.deleteItem(item.id));
}

export function renderArchive(ctx) {
  const lang = getLang();
  const items = ctx.state.items.filter((i) => i.archived).sort((a, b) => b.updatedAt - a.updatedAt);
  return h('section', { class: 'space-y-4' },
    h('h1', { class: 'text-xl font-bold' }, t('archive.title')),
    items.length
      ? h('div', { class: 'grid gap-3 md:grid-cols-2' }, items.map((item) => {
        const cat = ctx.state.categories.find((c) => c.id === item.categoryId);
        return h('div', { class: 'card flex items-center gap-3' },
          ring(progress(item), colorHex(cat?.color), 48),
          h('button', { type: 'button', class: 'flex-1 min-w-0 text-left', onclick: () => openItemDetail(ctx, item.id) },
            h('p', { class: 'font-semibold truncate' }, item.name),
            h('p', { class: 'text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums' },
              `${cat?.name ?? ''} · ${formatNumber(item.current, lang)} / ${formatNumber(item.target, lang)}`)),
          iconButton('archive-restore', () => safely(() => ctx.store.setArchived(item.id, false)), t('common.restore')),
          iconButton('trash-2', () => remove(ctx, item), t('common.delete')));
      }))
      : emptyState('archive', t('archive.empty')));
}
