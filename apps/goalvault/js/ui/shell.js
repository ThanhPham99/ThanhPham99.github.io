// App frame: sidebar (desktop), bottom tabs (mobile), header with language / theme / account.
import { getLang, t } from '../i18n.js';
import { routeHref } from '../route.js';
import { h, icon, iconButton } from './dom.js';
import { getTheme, nextTheme } from './theme.js';

const NAV = [
  { name: 'overview', icon: 'layout-dashboard', label: 'nav.overview' },
  { name: 'categories', icon: 'folder', label: 'nav.categories' },
  { name: 'archive', icon: 'archive', label: 'nav.archive' },
];
const THEME_ICONS = { system: 'monitor', light: 'sun', dark: 'moon' };

export function brand(size = 'md') {
  const big = size === 'lg';
  return h('div', { class: `flex items-center gap-2 font-extrabold tracking-tight ${big ? 'text-3xl' : 'text-lg'}` },
    h('span', { class: `${big ? 'w-12 h-12 rounded-2xl' : 'w-8 h-8 rounded-xl'} bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30` },
      icon('vault', big ? 'w-7 h-7' : 'w-5 h-5')),
    h('span', {}, 'Goal', h('span', { class: 'text-brand-600 dark:text-brand-400' }, 'vault')));
}

function userBadge(user) {
  if (user?.photoURL) {
    return h('img', { src: user.photoURL, alt: user.displayName ?? '', referrerpolicy: 'no-referrer', class: 'w-8 h-8 rounded-full mx-1' });
  }
  return h('span', { class: 'w-8 h-8 mx-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 flex items-center justify-center text-sm font-bold' },
    (user?.displayName ?? '?').charAt(0).toUpperCase());
}

export function renderShell(ctx, content) {
  const isActive = (name) => ctx.route.name === name || (name === 'categories' && ctx.route.name === 'category');
  const sideLink = (n) => h('a', {
    href: routeHref(n.name),
    class: `flex items-center gap-3 px-3 h-11 rounded-xl font-medium transition ${isActive(n.name)
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`,
  }, icon(n.icon), t(n.label));
  const tabLink = (n) => h('a', {
    href: routeHref(n.name),
    class: `flex flex-col items-center justify-center gap-0.5 h-16 text-xs font-medium ${isActive(n.name)
      ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'}`,
  }, icon(n.icon), t(n.label));
  const theme = getTheme();

  return h('div', { class: 'min-h-screen md:flex' },
    h('aside', { class: 'hidden md:flex md:flex-col md:w-60 md:shrink-0 md:h-screen md:sticky md:top-0 gap-1 p-4 border-r border-slate-200 dark:border-slate-800' },
      h('div', { class: 'px-2 pt-1 pb-6' }, brand()),
      NAV.map(sideLink)),
    h('div', { class: 'flex-1 min-w-0' },
      h('header', { class: 'sticky top-0 z-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur' },
        h('div', { class: 'max-w-5xl mx-auto px-4 h-14 flex items-center gap-1' },
          h('div', { class: 'md:hidden' }, brand()),
          h('div', { class: 'flex-1' }),
          h('button', { type: 'button', class: 'btn btn-ghost btn-sm', title: t('common.language'), onclick: () => ctx.setLang(getLang() === 'vi' ? 'en' : 'vi') },
            icon('languages', 'w-4 h-4'), getLang().toUpperCase()),
          iconButton(THEME_ICONS[theme], () => ctx.setTheme(nextTheme(theme)), `${t('common.theme')}: ${t(`theme.${theme}`)}`),
          userBadge(ctx.user),
          iconButton('log-out', ctx.signOut, t('common.signOut')))),
      h('main', { class: 'max-w-5xl mx-auto px-4 pt-2 pb-28 md:pb-12' }, content)),
    h('nav', { class: 'md:hidden fixed bottom-0 inset-x-0 z-30 grid grid-cols-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]' },
      NAV.map(tabLink)));
}
