// Temporary stub — replaced in Task 7.
import { t } from '../i18n.js';
import { h } from './dom.js';

export function renderCategories() {
  return h('h1', { class: 'text-xl font-bold' }, t('nav.categories'));
}

export function renderCategoryDetail() {
  return h('h1', { class: 'text-xl font-bold' }, t('nav.categories'));
}
