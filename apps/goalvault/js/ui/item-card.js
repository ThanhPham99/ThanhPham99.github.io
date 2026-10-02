// Compact goal card used in category detail and the overview.
import { itemStatus, todayStr } from '../domain.js';
import { displayNumber } from '../privacy.js';
import { getLang, t } from '../i18n.js';
import { colorHex } from '../presets.js';
import { h } from './dom.js';
import { openItemDetail } from './item-detail.js';
import { bulletBar, deadlineText, ring, statusBadge } from './progress.js';

export function itemCard(ctx, item, { showCategory = false } = {}) {
  const cat = ctx.state.categories.find((c) => c.id === item.categoryId);
  const color = colorHex(cat?.color);
  const st = itemStatus(item, todayStr());
  const lang = getLang();
  const meta = [
    showCategory ? cat?.name : null,
    st.achieved ? null : `${t('item.remaining')} ${displayNumber(st.remaining, lang)}`,
    deadlineText(st) || null,
  ].filter(Boolean).join(' · ');
  return h('button', {
    type: 'button',
    class: 'card card-hover w-full text-left flex items-center gap-3.5',
    onclick: () => openItemDetail(ctx, item.id),
  },
  ring(st.pct, color),
  h('div', { class: 'min-w-0 flex-1 space-y-1.5' },
    h('div', { class: 'flex items-start justify-between gap-2' },
      h('p', { class: 'font-semibold leading-snug line-clamp-2 break-words' }, item.name),
      statusBadge(st)),
    h('p', { class: 'text-sm tabular-nums truncate' },
      h('span', { class: 'font-semibold' }, displayNumber(item.current, lang)),
      h('span', { class: 'muted' }, ` / ${displayNumber(item.target, lang)}`)),
    item.deadline && !st.achieved ? bulletBar(st.pct, st.expectedPct, color) : null,
    meta ? h('p', { class: 'text-xs muted truncate' }, meta) : null));
}
