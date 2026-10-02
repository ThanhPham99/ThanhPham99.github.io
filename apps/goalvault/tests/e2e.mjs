// End-to-end UI tests: drives headless Chrome over the DevTools protocol against the ?demo=1 build.
// Usage (from repo root): node apps/goalvault/tests/e2e.mjs [scenario-name-filter]
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = createServer((req, res) => {
  const path = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  try {
    const file = statSync(path).isDirectory() ? join(path, 'index.html') : path;
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/apps/goalvault/`;

const profile = mkdtempSync(join(tmpdir(), 'goalvault-e2e-'));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });

let targets;
for (let i = 0; i < 60 && !targets; i++) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch { await sleep(200); }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let seq = 0;
const pending = new Map();
let exceptions = [];
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  if (m.method === 'Page.javascriptDialogOpening') {
    exceptions.push(`native dialog: ${m.params.message}`);
    send('Page.handleJavaScriptDialog', { accept: true });
  }
});
const send = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
await send('Runtime.enable');
await send('Page.enable');
await send('Network.enable');

// In-page helpers available to every scenario body.
const HELPERS = `
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const panel = () => $$('.modal-panel').at(-1);
  const modals = () => $$('.modal-panel').length;
  const type = (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
  const btn = (text, root = document) => $$('button', root).find((b) => b.getAttribute('aria-label') === text || b.textContent.trim() === text)
    ?? $$('button', root).find((b) => b.textContent.includes(text));
  const click = async (text, root, ms = 250) => { const b = btn(text, root); if (!b) throw new Error('no button: ' + text); b.click(); await sleep(ms); };
  const go = async (hash) => { location.hash = hash; await sleep(300); };
  const texts = (sel = '#app *') => $$(sel).filter((e) => e.children.length === 0).map((e) => e.textContent.trim()).filter(Boolean);
  const hasText = (t, root = document.getElementById('app')) => root.textContent.includes(t);
  const toasts = () => $$('#toast-root .toast').map((t) => t.textContent);
  const esc = async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await sleep(200); };
  const openGoal = async (name) => { const b = $$('#app button').find((x) => $$('p', x).some((p) => p.textContent === name)); if (!b) throw new Error('no goal: ' + name); b.click(); await sleep(400); };
  const fill = (values) => { const els = $$('input, textarea', panel()); for (const [i, v] of Object.entries(values)) type(els[i], v); };
  const waitFor = async (fn, ms = 15000) => { const end = Date.now() + ms; while (Date.now() < end) { if (fn()) return true; await sleep(100); } return false; };
  const results = [];
  const check = (name, ok, detail = '') => results.push({ name, ok: !!ok, detail: ok ? '' : JSON.stringify(detail) });
`;

async function runScenario(url, body, width = 1280, { blockedUrls = [] } = {}) {
  exceptions = [];
  // Blocked URLs fail with net::ERR_BLOCKED_BY_CLIENT, exactly like an ad-blocking extension.
  await send('Network.setBlockedURLs', { urls: blockedUrls });
  // Each scenario starts from a clean device: no remembered language, theme or hide-amounts choice.
  await send('Storage.clearDataForOrigin', { origin: new URL(BASE).origin, storageTypes: 'local_storage' });
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 });
  await send('Page.navigate', { url: 'about:blank' });
  await send('Page.navigate', { url });
  await sleep(2500);
  const res = await send('Runtime.evaluate', {
    expression: `(async () => { ${HELPERS} try { ${body} } catch (e) { results.push({ name: 'scenario threw', ok: false, detail: String(e && e.stack || e) }); } return results; })()`,
    awaitPromise: true, returnByValue: true,
  });
  const results = res.result?.result?.value ?? [{ name: 'evaluate failed', ok: false, detail: JSON.stringify(res.result) }];
  // showError() logs rejected writes via console.error on purpose; only uncaught exceptions count here.
  results.push({ name: 'no uncaught exceptions', ok: exceptions.length === 0, detail: exceptions.join(' | ') });
  return results;
}

const DEMO = `${BASE}?demo=1`;
const SCENARIOS = [
  ['login screen (real Firebase config)', BASE, 1280, `
    await waitFor(() => btn('Đăng nhập với Google'));
    check('Google button shown', btn('Đăng nhập với Google'));
    check('demo link shown', $('a[href="?demo=1"]'));
    await click('English');
    check('login switches to English', btn('Sign in with Google'), texts());
    check('html lang en', document.documentElement.lang === 'en');
    await click('Tiếng Việt');
    check('login back to Vietnamese', btn('Đăng nhập với Google'));
  `],
  ['blocked Firestore is reported on the login screen', BASE, 1280, `
    await waitFor(() => $('[data-blocked-warning]'));
    const warn = $('[data-blocked-warning]');
    check('warning shown when an extension blocks Firestore', warn && hasText('chặn', warn), document.body.innerText.slice(0, 300));
    check('warning offers reload', warn && btn('Tải lại', warn));
    check('sign-in still offered', btn('Đăng nhập với Google'));
  `, { blockedUrls: ['*firestore.googleapis.com*'] }],
  ['no warning when Firestore is reachable', BASE, 1280, `
    await waitFor(() => btn('Đăng nhập với Google'));
    await sleep(2000);
    check('no blocked warning', !$('[data-blocked-warning]'));
  `],
  ['overview numbers and lists', DEMO, 1280, `
    await sleep(800);
    const heroEl = $('[data-hero]');
    check('hero average', hasText('55%', heroEl), heroEl?.textContent);
    check('hero achieved count', hasText('2/10 mục tiêu đã đạt', heroEl), heroEl?.textContent);
    check('hero chips', hasText('3 cần chú ý', heroEl) && hasText('2 sắp tới hạn', heroEl), heroEl?.textContent);
    const section = (t) => $$('#app [data-section]').find((s) => s.dataset.section === t);
    const att = $$('.attention-name', section('Cần chú ý')).map((p) => p.textContent);
    check('attention list merged and ordered by urgency', att.join() === 'Nhật Bản,Bảo hiểm sức khỏe,Đà Lạt', att);
    check('overdue badge', hasText('Trễ hạn') && hasText('Trễ 5 ngày'));
    check('trend chart drawn', window.Chart?.getChart($('#app canvas')));
    check('archived goal excluded', !hasText('Hà Giang'));
    const goals = () => section('Tất cả mục tiêu');
    const headers = () => $$('[data-category-section] > button', goals());
    const goalNames = () => $$('.card.w-full p.font-semibold', goals()).map((p) => p.textContent);
    check('one collapsible section per category', headers().map((b) => $('p', b).textContent).join() === 'Tiết kiệm,Du lịch,Đầu tư', headers().map((b) => b.textContent));
    check('sections expanded by default', headers().every((b) => b.getAttribute('aria-expanded') === 'true'));
    check('all 10 active goals listed', goalNames().length === 10, goalNames());
    check('section header shows count and average', hasText('4 mục tiêu', headers()[0]) && hasText('%', headers()[0]));
    const firstSection = headers()[0].parentElement;
    const tagGroup = $$('[data-tag-group]', firstSection).find((g) => g.dataset.tagGroup === 'An toàn');
    check('goals grouped by tag inside category', tagGroup && $$('.card.w-full', tagGroup).length === 2);
    check('untagged goal standalone inside category', hasText('Mua laptop', firstSection) && !hasText('Mua laptop', tagGroup));
    headers()[0].click(); await sleep(300);
    check('collapse hides that category goals', headers()[0].getAttribute('aria-expanded') === 'false' && !goalNames().includes('Quỹ khẩn cấp') && goalNames().includes('Quỹ ETF'), goalNames());
    headers()[0].click(); await sleep(300);
    check('expand shows them again', goalNames().includes('Quỹ khẩn cấp'));
    check('chart survives re-render', window.Chart?.getChart($('#app canvas')));
    $$('button', section('Cần chú ý'))[0].click(); await sleep(400);
    check('attention row opens goal', hasText('Nhật Bản', panel()));
    check('bullet bar with expectation marker', hasText('mức cần đạt hôm nay', panel()));
  `],
  ['category CRUD and validation', DEMO, 1280, `
    await go('#/categories');
    await click('Danh mục mới');
    await click('Lưu', panel());
    check('empty name rejected', hasText('Không được để trống.', panel()));
    fill({ 0: '  Hưu trí  ' });
    await click('violet', panel()); await click('landmark', panel());
    await click('Lưu', panel());
    check('modal closed after save', modals() === 0);
    const row = $$('#app [data-id]').at(-1);
    check('new category trimmed and last', $('p', row).textContent === 'Hưu trí', $('p', row).textContent);
    check('new category colour applied', $('span[style]', row).style.background.includes('139, 92, 246'), $('span[style]', row).style.background);
    check('new category shows 0 goals', hasText('0 mục tiêu', row) && hasText('—', row));
    await click('Sửa', row);
    check('edit form prefilled', $('input', panel()).value === 'Hưu trí');
    fill({ 0: 'Nghỉ hưu' }); await click('Lưu', panel());
    check('category renamed', hasText('Nghỉ hưu'));
    await click('Xóa', $$('#app [data-id]').at(-1));
    check('delete asks for confirmation', hasText('Xóa danh mục "Nghỉ hưu" và 0 mục tiêu', panel()));
    await click('Hủy', panel());
    check('cancel keeps category', hasText('Nghỉ hưu'));
    await click('Xóa', $$('#app [data-id]').at(-1)); await click('Xóa', panel());
    check('category deleted', !hasText('Nghỉ hưu') && $$('#app [data-id]').length === 3);
    await go('#/category/c2');
    await click('Xóa', $('#app section > div'));
    check('cascade count in confirm', hasText('và 3 mục tiêu', panel()), panel().textContent);
    await click('Xóa', panel()); await sleep(200);
    check('deleting from detail returns to list', location.hash === '#/categories');
    check('cascade removed goals', !$$('#app [data-id]').some((r) => r.textContent.includes('Du lịch')));
    await go('#/category/does-not-exist'); await sleep(200);
    check('unknown category redirects', location.hash === '#/categories');
  `],
  ['user text is never parsed as HTML', DEMO, 1280, `
    const X = '<img src=x onerror="window.__xss=1">';
    await go('#/categories');
    await click('Danh mục mới'); fill({ 0: X }); await click('Lưu', panel());
    $$('#app a[href^="#/category/"]').at(-1).click(); await sleep(300);
    await click('Thêm mục tiêu');
    fill({ 0: X, 1: '100', 3: X, 5: X }); await click('Lưu', panel());
    await openGoal(X);
    await click('Nạp / Rút'); fill({ 0: '5', 2: X }); await click('Lưu', panel());
    await go('#/');
    await sleep(500);
    check('no injected img element', !$('img[src="x"]'));
    check('no script executed', !window.__xss);
    check('text rendered literally', $$('#app p, #app span, .modal-panel p').some((e) => e.textContent === X));
  `],
  ['goal form validation and number entry', DEMO, 1280, `
    await go('#/category/c1');
    await click('Thêm mục tiêu');
    fill({ 1: '0', 2: '-1', 4: '2026-02-30' });
    await click('Lưu', panel());
    const errs = $$('.text-rose-500', panel()).map((e) => e.textContent);
    check('name required', errs.includes('Không được để trống.'), errs);
    check('target must be positive', errs.includes('Phải là số lớn hơn 0.'), errs);
    check('current non-negative', errs.includes('Không được nhỏ hơn 0.'), errs);
    fill({ 0: 'Xe hơi', 1: 'abc', 2: '' });
    check('preview flags invalid number', hasText('Số không hợp lệ.', panel()));
    fill({ 1: '1.000.000.000' });
    check('preview shows parsed value', hasText('= 1.000.000.000', panel()));
    fill({ 1: '1,5' });
    check('vi comma is decimal', hasText('= 1,5', panel()));
    fill({ 1: '800.000.000', 2: '200.000.000', 3: 'Xe cộ', 4: '' });
    await click('Lưu', panel());
    check('goal created', modals() === 0 && hasText('Xe hơi'), toasts());
    await openGoal('Xe hơi');
    check('current stored', hasText('200.000.000', panel()) && hasText('/ 800.000.000', panel()));
    check('starting value logged as adjust', $$('li', panel()).length === 1 && hasText('Điều chỉnh', panel()));
    await click('Sửa', panel());
    const tagInput = $('input[list]', panel());
    check('tag autocomplete lists category tags', [...$('#goalvault-tags').options].map((o) => o.value).includes('An toàn'));
    check('edit prefill exact', $$('input', panel())[1].value === '800.000.000' && tagInput.value === 'Xe cộ');
    await click('Lưu', panel());
    check('untouched edit creates no entry', $$('li', panel()).length === 1);
  `],
  ['date fields: dd/mm/yyyy typing and calendar picker', DEMO, 1280, `
    await go('#/category/c1');
    await click('Thêm mục tiêu');
    const field = () => $('input[data-date]', panel());
    check('deadline is a dd/mm/yyyy text field', field()?.type === 'text' && field().placeholder === 'dd/mm/yyyy');
    type(field(), '23032026');
    check('typing digits inserts slashes', field().value === '23/03/2026', field().value);
    fill({ 0: 'Ngày test', 1: '100' });
    type(field(), '31/02/2026');
    await click('Lưu', panel());
    check('impossible date rejected', hasText('Ngày không hợp lệ.', panel()));
    field().focus(); field().click(); await sleep(300);
    const cal = $('.flatpickr-calendar.open');
    check('calendar opens', cal);
    check('calendar in Vietnamese, week starts Monday', cal && $('.flatpickr-weekday', cal).textContent.trim() === 'T2', cal && $('.flatpickr-weekday', cal).textContent);
    const day = $$('.flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)', cal).find((d) => d.textContent === '15');
    day.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); day.click(); await sleep(300);
    check('picking a day fills dd/mm/yyyy', field().value.split('/')[0] === '15' && field().value.split('/').length === 3 && field().value.length === 10, field().value);
    const picked = field().value;
    await click('Lưu', panel());
    check('goal saved with picked date', modals() === 0, $$('.modal-panel .text-rose-500').map((e) => e.textContent));
    await openGoal('Ngày test');
    check('detail shows the picked date', hasText(picked, panel()), panel().textContent);
    await click('Sửa', panel());
    check('edit prefills dd/mm/yyyy', field().value === picked, field().value);
    await esc();
    await click('Nạp / Rút', panel());
    const d = new Date(); const p2 = (n) => String(n).padStart(2, '0');
    check('entry date defaults to today as dd/mm/yyyy', field().value === p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear(), field().value);
    await esc(); await esc();
    await click('VI'); await go('#/category/c1'); await click('Add goal');
    check('same format in English UI', field().placeholder === 'dd/mm/yyyy');
  `],
  ['tag groups, rename, collapse, untag', DEMO, 1280, `
    await go('#/category/c1');
    const group = (tag) => $$('#app [data-tag-group]').find((g) => g.dataset.tagGroup === tag);
    check('group "An toàn" has 2 goals', group('An toàn') && $('.tag-count', group('An toàn')).textContent === '2');
    check('group shows average', hasText('50%', group('An toàn')), group('An toàn')?.textContent);
    check('untagged goals standalone', !group('Mua laptop') && hasText('Mua laptop'));
    await click('Thêm mục tiêu'); fill({ 0: 'Quỹ con', 1: '10', 3: '  an  toàn ' }); await click('Lưu', panel());
    check('different case makes its own group', group('an toàn'));
    await click('Đổi tên tag', group('an toàn')); fill({ 0: 'An toàn' }); await click('Lưu', panel());
    check('rename merges into existing group', !group('an toàn') && $('.tag-count', group('An toàn')).textContent === '3');
    $('button', group('An toàn')).click(); await sleep(200);
    check('collapse hides goals', !hasText('Quỹ khẩn cấp'));
    $('button', group('An toàn')).click(); await sleep(200);
    check('expand shows goals', hasText('Quỹ khẩn cấp'));
    await click('Đổi tên tag', group('An toàn')); fill({ 0: '   ' }); await click('Lưu', panel());
    check('renaming to blank untags', !group('An toàn') && hasText('Quỹ khẩn cấp') && hasText('Quỹ con'));
  `],
  ['goal detail: entries, limits, archive prompt', DEMO, 1280, `
    await go('#/category/c1');
    await openGoal('Quỹ khẩn cấp');
    const value = () => $('.modal-panel [data-current]').textContent;
    const stats = $$('.text-xs', panel()).map((e) => e.textContent);
    check('stats shown', ['Còn thiếu', 'Hạn chót', 'Cần góp mỗi tháng', 'Tiến độ kỳ vọng'].every((s) => stats.includes(s)), stats);
    check('history chart drawn', window.Chart?.getChart($('canvas', panel())));
    check('entries newest first', $$('li', panel()).length === 4 && hasText('+5.000.000', $('li', panel())));
    await click('Nạp / Rút', panel()); fill({ 0: '0' }); await click('Lưu', panel());
    check('zero amount rejected', hasText('Phải là số lớn hơn 0.', panel()));
    fill({ 0: '1.000.000', 1: '' }); await click('Lưu', panel());
    check('empty date rejected', hasText('Ngày không hợp lệ.', panel()));
    fill({ 1: '15/01/2026', 2: 'Lương' }); await click('Lưu', panel());
    check('deposit applied', value() === '31.000.000', value());
    check('backdated entry listed', hasText('15/01/2026 · Nạp', panel()));
    await click('Nạp / Rút', panel()); await click('Rút', panel()); fill({ 0: '31.000.001' }); await click('Lưu', panel());
    check('overdraw rejected with message', toasts().includes('Giá trị hiện có không thể nhỏ hơn 0.') && value() === '31.000.000', toasts());
    check('form stays open after rejection', modals() === 2);
    await esc();
    check('escape closes only top modal', modals() === 1);
    await click('Nạp / Rút', panel()); await click('Rút', panel()); fill({ 0: '1.000.000' }); await click('Lưu', panel());
    check('withdraw applied', value() === '30.000.000' && hasText('-1.000.000', panel()));
    const firstDeposit = $$('li', panel()).find((li) => li.textContent.includes('+10.000.000'));
    $('button[aria-label="Sửa"]', firstDeposit).click(); await sleep(250);
    check('entry edit prefilled', $('input', panel()).value === '10.000.000');
    fill({ 0: '12.000.000' }); await click('Lưu', panel());
    check('entry edit applies difference', value() === '32.000.000', value());
    const lastEntry = $$('li', panel()).find((li) => li.textContent.includes('+5.000.000'));
    $('button[aria-label="Xóa"]', lastEntry).click(); await sleep(250);
    await click('Xóa', panel());
    check('entry delete applies', value() === '27.000.000', value());
    await click('Đặt giá trị', panel()); await click('Lưu', panel());
    check('unchanged set value adds no entry', $$('li', panel()).length === 5, $$('li', panel()).length);
    await click('Đặt giá trị', panel()); fill({ 0: '-5' }); await click('Lưu', panel());
    check('negative set value rejected', hasText('Không được nhỏ hơn 0.', panel()));
    fill({ 0: '60.000.000' }); await click('Lưu', panel());
    check('congratulation toast on reaching target', toasts().some((t) => t.includes('đã đạt mục tiêu')), toasts());
    check('no archive prompt dialog', modals() === 1);
    check('adjust entry for set value', hasText('Điều chỉnh', panel()));
    check('achieved badge', $('.chip', panel()).textContent === 'Đã đạt');
    check('goals have no archive button', !btn('Lưu trữ', panel()));
  `],
  ['archive a category', DEMO, 1280, `
    await go('#/categories');
    const row = (name) => $$('#app [data-id]').find((r) => $('p', r)?.textContent === name);
    check('archive button on each row', $$('#app [data-id]').every((r) => btn('Lưu trữ danh mục', r)));
    await click('Lưu trữ danh mục', row('Du lịch'), 300);
    check('archived category leaves the list', !row('Du lịch') && $$('#app [data-id]').length === 2);
    await go('#/');
    check('overview drops its section', !$$('[data-category-section] > button p').some((p) => p.textContent === 'Du lịch'));
    check('overview excludes its goals', hasText('2/7 mục tiêu đã đạt', $('[data-hero]')), $('[data-hero]').textContent);
    check('attention excludes its goals', $$('.attention-name').map((p) => p.textContent).join() === 'Bảo hiểm sức khỏe', $$('.attention-name').map((p) => p.textContent));
    await go('#/archive');
    const sec = (t) => $$('#app [data-section]').find((s) => s.dataset.section === t);
    check('archive lists the category', hasText('Du lịch', sec('Danh mục')) && hasText('3 mục tiêu', sec('Danh mục')));
    check('only categories in archive', hasText('Năm 2025', sec('Danh mục')) && !$$('#app .card.w-full').length);
    $('a[href="#/category/c2"]', sec('Danh mục')).click(); await sleep(300);
    check('archived category viewable with banner', hasText('Danh mục này đã được lưu trữ') && hasText('Đà Lạt'));
    await click('Khôi phục', $('[data-archived-banner]'), 300);
    check('restore from banner', !$('[data-archived-banner]'));
    await go('#/categories');
    check('restored category back in list', row('Du lịch'));
    await go('#/category/c3');
    await click('Lưu trữ danh mục', $('#app section > div'), 300);
    check('archive from detail shows banner', $('[data-archived-banner]'));
    await go('#/archive');
    await click('Khôi phục', sec('Danh mục'), 300);
    check('restore from archive tab', !hasText('Đầu tư', sec('Danh mục')));
    await go('#/');
    check('overview counts restored goals', hasText('2/10 mục tiêu đã đạt', $('[data-hero]')));
    await go('#/categories');
    await click('Lưu trữ danh mục', row('Đầu tư'), 300);
    await go('#/archive');
    await click('Xóa', sec('Danh mục')); await click('Xóa', panel(), 300);
    check('delete archived category permanently', !hasText('Đầu tư') && hasText('Năm 2025'));
  `],
  ['empty account shows onboarding', DEMO, 1280, `
    await go('#/categories');
    for (let i = 0; i < 3; i++) { await click('Xóa', $$('#app [data-id]')[0]); await click('Xóa', panel()); }
    check('categories empty state', hasText('Chưa có danh mục nào.'));
    await go('#/');
    check('overview welcome', hasText('Bắt đầu bằng việc tạo danh mục đầu tiên.'));
    await click('Danh mục mới'); fill({ 0: 'Mới' }); await click('Lưu', panel());
    check('overview after first category', hasText('Tiến độ trung bình') && hasText('—'));
    await go('#/categories'); $$('#app a[href^="#/category/"]')[0].click(); await sleep(300);
    check('empty category message', hasText('Danh mục này chưa có mục tiêu.'));
  `],
  ['English UI and number formats', DEMO, 1280, `
    await click('VI');
    check('header shows EN', btn('EN'));
    check('nav translated', hasText('Overview') && hasText('Categories') && hasText('Archive'));
    check('KPI translated', hasText('Average progress') && hasText('Needs attention'));
    const raw = /^(app|nav|common|kpi|overview|category|item|status|entry|tag|archive|error|login|theme)\\.[A-Za-z/-]+$/;
    const leak = () => texts('#app *, .modal-panel *').filter((t) => raw.test(t));
    check('no raw i18n keys on overview', leak().length === 0, leak());
    await go('#/category/c1'); await openGoal('Quỹ khẩn cấp');
    check('English number format', hasText('30,000,000', panel()) && hasText('/ 60,000,000', panel()));
    check('English dates', /\\d{2}\\/\\d{2}\\/\\d{4}/.test($('li', panel()).textContent));
    check('detail translated', btn('Add / Withdraw', panel()) && hasText('Remaining', panel()));
    check('no raw i18n keys in detail', leak().length === 0, leak());
    await click('Add / Withdraw', panel()); fill({ 0: '1.5' });
    check('en dot is decimal', hasText('= 1.5', panel()));
    fill({ 0: '1,000' });
    check('en comma groups thousands', hasText('= 1,000', panel()));
    await click('Save', panel());
    check('deposit in en', hasText('30,001,000', panel()));
    await esc(); await go('#/archive');
    check('archive translated', hasText('Archived'));
    await click('EN');
    check('back to Vietnamese', hasText('Tổng quan'));
  `],
  ['hide amounts toggle', DEMO, 1280, `
    const toggle = () => btn('Ẩn số liệu') ?? btn('Hiện số liệu');
    check('toggle on overview', btn('Ẩn số liệu') && btn('Ẩn số liệu').getAttribute('aria-pressed') === 'false');
    check('amounts visible by default', hasText('6.000.000 / 12.000.000') || hasText('6.000.000'));
    toggle().click(); await sleep(300);
    check('toggle switches state', btn('Hiện số liệu')?.getAttribute('aria-pressed') === 'true');
    check('amounts masked on overview', hasText('******') && !hasText('6.000.000') && !hasText('12.000.000'));
    check('percentages still shown', hasText('55%', $('[data-hero]')) && hasText('50%'));
    check('choice remembered', localStorage.getItem('goalvault.hideAmounts') === '1');
    await openGoal('Quỹ khẩn cấp');
    check('detail value masked', $('.modal-panel [data-current]').textContent === '******');
    check('detail target and stats masked', ['30.000.000', '60.000.000', '10.000.000', '+5.000.000'].every((v) => !hasText(v, panel())), panel().textContent);
    check('chart axis masked', window.Chart.getChart($('canvas', panel())).options.scales.y.ticks.callback(1000) === '******');
    check('detail % kept', hasText('50%', panel()));
    await esc();
    await go('#/category/c1');
    check('category page masked', hasText('******') && !hasText('30.000.000'));
    await go('#/');
    toggle().click(); await sleep(300);
    check('toggle back shows amounts', hasText('6.000.000') && !hasText('******') && localStorage.getItem('goalvault.hideAmounts') === '0');
  `],
  ['theme toggle', DEMO, 1280, `
    const html = document.documentElement;
    const themeBtn = () => btn('Giao diện: Theo hệ thống') ?? btn('Giao diện: Sáng') ?? btn('Giao diện: Tối');
    check('starts on system', btn('Giao diện: Theo hệ thống'));
    themeBtn().click(); await sleep(200);
    check('light', btn('Giao diện: Sáng') && !html.classList.contains('dark'));
    themeBtn().click(); await sleep(200);
    check('dark', btn('Giao diện: Tối') && html.classList.contains('dark'));
    check('dark persisted', localStorage.getItem('goalvault.theme') === 'dark');
    themeBtn().click(); await sleep(200);
    check('back to system', btn('Giao diện: Theo hệ thống'));
  `],
  ['modal overlay and stacking', DEMO, 1280, `
    await go('#/category/c1'); await openGoal('Mua laptop');
    await click('Sửa', panel());
    check('two modals stacked', modals() === 2);
    $$('.modal-overlay').at(-1).dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); await sleep(200);
    check('overlay click closes top', modals() === 1);
    $('.modal-panel').dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); await sleep(200);
    check('click inside panel keeps it', modals() === 1);
    await click('Đóng', panel());
    check('close button closes', modals() === 0);
  `],
  ['mobile layout 375px', DEMO, 375, `
    for (const h of ['#/', '#/categories', '#/category/c1', '#/archive']) {
      await go(h); await sleep(300);
      check('no horizontal scroll ' + h, document.documentElement.scrollWidth <= innerWidth, [document.documentElement.scrollWidth, innerWidth]);
    }
    await go('#/categories');
    const firstRow = $$('#app [data-id]')[0];
    const nameEl = $('p', firstRow);
    check('category name not truncated on phone', nameEl.scrollWidth <= nameEl.clientWidth, [nameEl.scrollWidth, nameEl.clientWidth]);
    await click('Thao tác', firstRow);
    check('actions sheet offers edit/archive/delete', ['Sửa', 'Lưu trữ danh mục', 'Xóa'].every((l) => btn(l, panel())), panel()?.textContent);
    await click('Lưu trữ danh mục', panel(), 300);
    check('archive from actions sheet', modals() === 0 && $$('#app [data-id]').length === 2);
    await go('#/category/c1');
    check('bottom tab: archived category highlights Lưu trữ', $('nav a[href="#/archive"]').className.includes('text-brand-600'));
    const nav = $('nav');
    check('bottom tabs visible', nav && getComputedStyle(nav).display !== 'none');
    check('sidebar hidden', getComputedStyle($('aside')).display === 'none');
    await go('#/category/c1'); await openGoal('Quỹ khẩn cấp');
    const r = panel().getBoundingClientRect();
    check('sheet full width at bottom', Math.round(r.width) === innerWidth && Math.round(r.bottom) === innerHeight, [r.width, r.bottom, innerWidth, innerHeight]);
    check('no horizontal scroll in sheet', panel().scrollWidth <= panel().clientWidth);
  `],
  ['desktop layout', DEMO, 1280, `
    check('sidebar visible', getComputedStyle($('aside')).display !== 'none');
    check('bottom tabs hidden', getComputedStyle($('nav')).display === 'none');
    await go('#/categories');
    check('sidebar marks active route', $('aside a[href="#/categories"]').className.includes('bg-brand-50'));
    await go('#/category/c1');
    check('categories stays active on detail', $('aside a[href="#/categories"]').className.includes('bg-brand-50'));
  `],
];

const filter = process.argv[2];
let failed = 0;
let passed = 0;
try {
  for (const [name, url, width, body, opts] of SCENARIOS) {
    if (filter && !name.includes(filter)) continue;
    const results = await runScenario(url, body, width, opts);
    const bad = results.filter((r) => !r.ok);
    passed += results.length - bad.length;
    failed += bad.length;
    console.log(`${bad.length ? '✖' : '✔'} ${name} (${results.length - bad.length}/${results.length})`);
    for (const r of bad) console.log(`    ✖ ${r.name} ${r.detail}`);
  }
} finally {
  ws.close();
  chrome.kill();
  server.close();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
