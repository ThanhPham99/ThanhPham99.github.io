// Bootstrap: picks demo or Firebase, wires auth → store → render loop, routing, language and theme.
import { getLang, onLangChange, setLang } from './i18n.js';
import { onPrivacyChange } from './privacy.js';
import { isFirestoreBlocked } from './connectivity.js';
import { parseRoute } from './route.js';
import { createMemoryStore } from './store-memory.js';
import { seedDemo } from './demo-seed.js';
import { closeAllModals, refreshIcons, safely, showError } from './ui/dom.js';
import { getTheme, initTheme, setTheme } from './ui/theme.js';
import { renderShell } from './ui/shell.js';
import { renderLogin } from './ui/login.js';
import { renderOverview } from './ui/overview.js';
import { renderCategories, renderCategoryDetail } from './ui/categories.js';
import { renderArchive } from './ui/archive.js';

const appRoot = document.getElementById('app');
const DEMO = new URLSearchParams(location.search).has('demo');
const VIEWS = {
  overview: (ctx) => renderOverview(ctx),
  categories: (ctx) => renderCategories(ctx),
  category: (ctx) => renderCategoryDetail(ctx, ctx.route.id),
  archive: (ctx) => renderArchive(ctx),
};

let firebase = null;
let unsubscribe = null;
let loginOptions = {};

const ctx = {
  store: null,
  state: null,
  user: null,
  route: parseRoute(location.hash),
  firestoreBlocked: false,
  listeners: new Set(),
  render: () => renderApp(),
  onState(fn) {
    ctx.listeners.add(fn);
    return () => ctx.listeners.delete(fn);
  },
  setLang(next) {
    setLang(next);
    if (ctx.store) safely(() => ctx.store.savePrefs({ lang: next }));
  },
  setTheme(next) {
    setTheme(next);
    if (ctx.store) safely(() => ctx.store.savePrefs({ theme: next }));
    renderApp();
  },
  signOut() {
    if (DEMO) location.href = location.pathname;
    else safely(() => firebase.signOutUser());
  },
};

function renderApp() {
  if (!ctx.state) return;
  appRoot.replaceChildren(renderShell(ctx, VIEWS[ctx.route.name](ctx)));
  refreshIcons();
  ctx.listeners.forEach((fn) => fn());
}

function showLogin(options = {}) {
  loginOptions = options;
  appRoot.replaceChildren(renderLogin({
    ...options,
    blocked: ctx.firestoreBlocked,
    onSignIn: () => safely(() => firebase.signInWithGoogle()),
    onToggleLang: () => setLang(getLang() === 'vi' ? 'en' : 'vi'),
  }));
  refreshIcons();
}

// First snapshot decides: saved prefs win; a brand-new user inherits what they picked on the login screen.
function syncPrefs(prefs) {
  if (prefs.lang || prefs.theme) {
    if (prefs.theme && prefs.theme !== getTheme()) setTheme(prefs.theme);
    if (prefs.lang && prefs.lang !== getLang()) setLang(prefs.lang);
  } else {
    safely(() => ctx.store.savePrefs({ lang: getLang(), theme: getTheme() }));
  }
}

function start(user, store) {
  ctx.user = user;
  ctx.store = store;
  store.setErrorHandler(showError);
  let first = true;
  unsubscribe = store.subscribe((state) => {
    ctx.state = state;
    if (first) {
      first = false;
      syncPrefs(state.prefs);
    }
    renderApp();
  }, showError);
}

function stop() {
  unsubscribe?.();
  unsubscribe = null;
  closeAllModals();
  ctx.store = null;
  ctx.state = null;
  ctx.user = null;
}

async function checkBlocked() {
  const blocked = await isFirestoreBlocked();
  if (blocked === ctx.firestoreBlocked) return;
  ctx.firestoreBlocked = blocked;
  if (ctx.state) renderApp();
  else if (!ctx.store) showLogin(loginOptions);
}

async function boot() {
  initTheme();
  document.documentElement.lang = getLang();
  if (DEMO) {
    const store = createMemoryStore();
    await seedDemo(store);
    start({ displayName: 'Demo', photoURL: null }, store);
    return;
  }
  try {
    firebase = await import('./firebase.js');
  } catch (err) {
    console.error(err);
    showLogin({ loadError: true });
    return;
  }
  if (!firebase.isConfigured) {
    showLogin({ setupNeeded: true });
    return;
  }
  checkBlocked();
  window.addEventListener('online', checkBlocked);
  const { createFirestoreStore } = await import('./store-firestore.js');
  firebase.watchAuth((user) => {
    stop();
    if (user) start(user, createFirestoreStore(firebase.db, user.uid));
    else showLogin();
  });
}

window.addEventListener('hashchange', () => {
  ctx.route = parseRoute(location.hash);
  renderApp();
  window.scrollTo(0, 0);
});

onLangChange(() => {
  if (ctx.state) renderApp();
  else if (!ctx.store) showLogin(loginOptions);
});

onPrivacyChange(() => renderApp());

boot().catch(showError);
