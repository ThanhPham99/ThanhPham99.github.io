// Compact goal card used in category detail and the overview grid.
import { formatNumber, itemStatus, todayStr } from '../domain.js';
import { getLang } from '../i18n.js';
import { colorHex } from '../presets.js';
import { h } from './dom.js';
import { openItemDetail } from './item-detail.js';
import { deadlineText, ring, statusBadge } from './progress.js';

export function itemCard(ctx, item, { showCategory = false } = {}) {
  const cat = ctx.state.categories.find((c) => c.id === item.categoryId);
  const st = itemStatus(item, todayStr());
  const lang = getLang();
  const meta = [showCategory ? cat?.name : null, showCategory ? item.tag : null, deadlineText(st) || null].filter(Boolean).join(' · ');
  return h('button', {
    type: 'button',
    class: 'card w-full text-left flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition',
    onclick: () => openItemDetail(ctx, item.id),
  },
  ring(st.pct, colorHex(cat?.color)),
  h('div', { class: 'min-w-0 flex-1 space-y-1' },
    h('div', { class: 'flex items-center gap-2' },
      h('p', { class: 'font-semibold truncate' }, item.name),
      statusBadge(st)),
    h('p', { class: 'text-sm text-slate-500 dark:text-slate-400 tabular-nums truncate' },
      `${formatNumber(item.current, lang)} / ${formatNumber(item.target, lang)}`),
    meta ? h('p', { class: 'text-xs text-slate-400 dark:text-slate-500 truncate' }, meta) : null));
}
