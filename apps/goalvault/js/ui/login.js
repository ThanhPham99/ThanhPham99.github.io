// Sign-in screen (also shows the "Firebase not configured" notice).
import { getLang, t } from '../i18n.js';
import { h, icon } from './dom.js';
import { brand } from './shell.js';

export function renderLogin({ setupNeeded = false, loadError = false, onSignIn, onToggleLang }) {
  const notice = setupNeeded || loadError;
  return h('div', { class: 'min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950' },
    h('div', { class: 'card w-full max-w-sm p-8 space-y-6 text-center' },
      h('div', { class: 'flex justify-end' },
        h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: onToggleLang }, icon('languages', 'w-4 h-4'), getLang() === 'vi' ? 'English' : 'Tiếng Việt')),
      h('div', { class: 'flex justify-center' }, brand('lg')),
      h('p', { class: 'text-slate-500 dark:text-slate-400' }, t('app.tagline')),
      notice
        ? h('div', { class: 'rounded-2xl bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 p-4 text-sm text-left' },
          t(setupNeeded ? 'login.setupNeeded' : 'login.loadError'))
        : h('button', { type: 'button', class: 'btn btn-primary w-full', onclick: onSignIn }, icon('log-in', 'w-4 h-4'), t('login.google')),
      h('a', { href: '?demo=1', class: 'block text-sm text-brand-600 dark:text-brand-400 hover:underline' }, t('login.demo'))));
}
