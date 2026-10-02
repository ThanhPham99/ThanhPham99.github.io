// Temporary stub — replaced in Task 9.
import { t } from '../i18n.js';
import { h } from './dom.js';

export function renderOverview() {
  return h('h1', { class: 'text-xl font-bold' }, t('nav.overview'));
}
