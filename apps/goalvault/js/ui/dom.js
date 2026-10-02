// DOM helpers: element builder, icons, modals, toasts, errors. User text always becomes text nodes.
import { colorHex } from '../presets.js';
import { t } from '../i18n.js';

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

export const icon = (name, cls = 'w-5 h-5') => h('i', { 'data-lucide': name, class: cls });

export function refreshIcons() {
  window.lucide?.createIcons();
}

const openModals = new Set();
const destroyPickers = (root) => root.querySelectorAll('[data-picker]').forEach((el) => el._flatpickr?.destroy());

export function openModal(build) {
  const root = document.getElementById('modal-root');
  const cleanups = [];
  const panel = h('div', { class: 'modal-panel', role: 'dialog', 'aria-modal': 'true' });
  const overlay = h('div', { class: 'modal-overlay' }, panel);
  const onKey = (e) => {
    // An open date picker takes Escape for itself.
    if (e.key === 'Escape' && document.querySelector('.flatpickr-calendar.open')) return;
    if (e.key === 'Escape' && root.lastElementChild === overlay) api.close();
  };
  const api = {
    panel,
    close() {
      if (!openModals.has(api)) return;
      openModals.delete(api);
      destroyPickers(panel);
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      cleanups.forEach((fn) => fn());
    },
    onClose(fn) {
      cleanups.push(fn);
    },
    setContent(node) {
      destroyPickers(panel);
      panel.replaceChildren(node);
      refreshIcons();
    },
  };
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) api.close();
  });
  document.addEventListener('keydown', onKey);
  openModals.add(api);
  root.append(overlay);
  api.setContent(build(api));
  panel.querySelector('[data-autofocus]')?.focus();
  return api;
}

export function closeAllModals() {
  [...openModals].forEach((m) => m.close());
}

export function iconButton(name, onclick, label) {
  return h('button', {
    type: 'button', class: 'icon-btn', title: label, 'aria-label': label,
    onclick: (e) => { e.preventDefault(); e.stopPropagation(); onclick(e); },
  }, icon(name));
}

// Bottom sheet listing actions (used where inline icon buttons would crowd a phone row).
export function actionSheet(title, actions) {
  openModal((api) => h('div', { class: 'space-y-2' },
    modalHeader(title, api),
    actions.map(({ icon: iconName, label, onSelect, danger = false }) => h('button', {
      type: 'button', 'aria-label': label,
      class: `w-full flex items-center gap-3 rounded-xl px-3 min-h-12 text-left font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${danger ? 'text-rose-600 dark:text-rose-400' : ''}`,
      onclick: () => { api.close(); onSelect(); },
    }, icon(iconName), label))));
}

export function modalHeader(title, api, subtitle) {
  return h('div', { class: 'flex items-start gap-3' },
    h('div', { class: 'flex-1 min-w-0' },
      h('h2', { class: 'text-lg font-bold break-words' }, title),
      subtitle ? h('p', { class: 'text-sm text-slate-500 dark:text-slate-400 break-words' }, subtitle) : null),
    iconButton('x', api.close, t('common.close')));
}

export function confirmDialog(message, { okLabel = t('common.confirm'), danger = false } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    openModal((api) => {
      api.onClose(() => { if (!answered) resolve(false); });
      const answer = (value) => {
        answered = true;
        resolve(value);
        api.close();
      };
      return h('div', { class: 'space-y-5' },
        h('p', { class: 'text-base break-words' }, message),
        h('div', { class: 'flex justify-end gap-2' },
          h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => answer(false) }, t('common.cancel')),
          h('button', { type: 'button', class: danger ? 'btn btn-danger' : 'btn btn-primary', 'data-autofocus': true, onclick: () => answer(true) }, okLabel)));
    });
  });
}

export function toast(message, kind = 'info') {
  const el = h('div', { class: `toast toast-${kind}`, role: 'status' }, message);
  document.getElementById('toast-root').append(el);
  setTimeout(() => el.remove(), 3500);
}

export function showError(err) {
  console.error(err);
  const key = `error.${err?.code ?? err?.message}`;
  const msg = t(key);
  toast(msg === key ? t('error.generic') : msg, 'error');
}

export async function safely(fn) {
  try {
    return await fn();
  } catch (err) {
    showError(err);
    return undefined;
  }
}

// Shown when an extension blocks Firestore: data then only lives in this browser's cache.
export function blockedWarning() {
  return h('div', { class: 'flex items-start gap-3 rounded-2xl bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-100 border border-rose-200 dark:border-rose-900 p-4 text-left', role: 'alert', 'data-blocked-warning': 'true' },
    icon('shield-alert', 'w-5 h-5 shrink-0 mt-0.5'),
    h('div', { class: 'flex-1 space-y-2' },
      h('p', { class: 'text-sm font-semibold' }, t('warning.blockedTitle')),
      h('p', { class: 'text-sm' }, t('warning.blocked')),
      h('button', { type: 'button', class: 'btn btn-sm bg-rose-600 hover:bg-rose-700 text-white', onclick: () => location.reload() }, icon('refresh-cw', 'w-4 h-4'), t('warning.reload'))));
}

export function emptyState(iconName, text, action = null) {
  return h('div', { class: 'card flex flex-col items-center text-center gap-3 py-10' },
    h('span', { class: 'w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300 flex items-center justify-center' }, icon(iconName, 'w-7 h-7')),
    h('p', { class: 'text-slate-500 dark:text-slate-400' }, text),
    action);
}

export function catIcon(category, size = 'md') {
  const box = size === 'sm' ? 'w-7 h-7 rounded-lg' : 'w-10 h-10 rounded-xl';
  return h('span', { class: `${box} shrink-0 flex items-center justify-center text-white`, style: { background: colorHex(category?.color) } },
    icon(category?.icon ?? 'target', size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'));
}
