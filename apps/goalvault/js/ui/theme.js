// Light / dark / system theme, persisted per device (and to Firestore prefs by app.js).
const KEY = 'goalvault.theme';
const THEMES = ['system', 'light', 'dark'];
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function read() {
  try {
    const v = localStorage.getItem(KEY);
    return THEMES.includes(v) ? v : 'system';
  } catch {
    return 'system';
  }
}

let theme = read();

export const getTheme = () => theme;
export const nextTheme = (current) => THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];

function apply() {
  const dark = theme === 'dark' || (theme === 'system' && media().matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function setTheme(next) {
  if (!THEMES.includes(next)) return;
  theme = next;
  try { localStorage.setItem(KEY, next); } catch { /* storage unavailable */ }
  apply();
}

export function initTheme() {
  apply();
  media().addEventListener('change', () => { if (theme === 'system') apply(); });
}
