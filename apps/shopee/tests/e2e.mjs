// End-to-end UI tests for Shop Mòe (`apps/shopee`) using headless Chrome over CDP.
// Usage (from repo root): node apps/shopee/tests/e2e.mjs [--screenshots <dir>]
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shotFlagIdx = process.argv.indexOf('--screenshots');
const shotDir = shotFlagIdx >= 0 ? process.argv[shotFlagIdx + 1] : null;
if (shotDir) mkdirSync(shotDir, { recursive: true });

const server = createServer((req, res) => {
  const filePath = join(ROOT, decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname));
  try {
    const file = statSync(filePath).isDirectory() ? join(filePath, 'index.html') : filePath;
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/apps/shopee/`;

const profile = mkdtempSync(join(tmpdir(), 'shopee-e2e-'));
const port = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(
  'google-chrome',
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,960',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);

let exitCode = 0;
try {
  let targets;
  for (let i = 0; i < 60 && !targets; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    } catch {
      await sleep(150);
    }
  }
  assert.ok(targets, 'Chrome DevTools endpoint failed to start');

  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));

  let seq = 0;
  const pending = new Map();
  const exceptions = [];

  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
    if (m.method === 'Runtime.exceptionThrown') {
      exceptions.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    }
  });

  const send = (method, params = {}) =>
    new Promise((r) => {
      const id = ++seq;
      pending.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', {
      expression: `(async () => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.result?.exceptionDetails) {
      throw new Error(res.result.exceptionDetails.exception?.description || res.result.exceptionDetails.text);
    }
    return res.result?.result?.value;
  };

  const capture = async (name) => {
    if (!shotDir) return;
    await sleep(300);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot.result?.data) {
      writeFileSync(join(shotDir, `${name}.png`), Buffer.from(shot.result.data, 'base64'));
    }
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1100,
    height: 920,
    deviceScaleFactor: 2,
    mobile: false,
  });

  await send('Page.navigate', { url: BASE });
  await sleep(1000);

  // 1. Initial Shop Mòe storefront state: no technical affiliate_id, Sub ID, or raw an_redir exposed
  const initialState = await evaluate(`
    const bodyText = document.body.innerText;
    const sfLink = document.getElementById('storefront-link');
    return {
      h1Count: document.querySelectorAll('h1').length,
      h1Text: document.querySelector('h1')?.textContent.trim(),
      storefrontHref: sfLink?.getAttribute('href'),
      storefrontTarget: sfLink?.getAttribute('target'),
      storefrontInTopbar: Boolean(sfLink?.closest('.topbar')),
      storefrontText: sfLink?.innerText.trim(),
      convertBtnText: document.getElementById('convert-btn-text')?.textContent.trim(),
      convertBtnIsBrand: document.getElementById('convert-btn')?.classList.contains('btn-brand'),
      perksCount: document.querySelectorAll('.perk-card').length,
      stepsCount: document.querySelectorAll('.step-item').length,
      donateLinkHref: document.querySelector('.store-footer a')?.getAttribute('href'),
      hasTechnicalLeak: /affiliate[_\\s-]*id|17360400567|sub[_\\s-]*id|an_redir/i.test(bodyText),
      historyHidden: document.getElementById('history-section').classList.contains('is-hidden'),
    };
  `);
  assert.equal(initialState.h1Count, 1);
  assert.equal(initialState.h1Text, 'Shop Mòe');
  assert.equal(initialState.storefrontHref, 'https://collshp.com/n/moevuive?view=storefront');
  assert.equal(initialState.storefrontTarget, '_blank');
  assert.equal(initialState.storefrontInTopbar, true);
  assert.match(initialState.storefrontText, /Ghé qua Tiệm Mòe/);
  assert.equal(initialState.convertBtnText, 'Tạo link mua hàng');
  assert.equal(initialState.convertBtnIsBrand, false, '#convert-btn must not compete visually with primary buy CTA');
  assert.equal(initialState.perksCount, 3);
  assert.equal(initialState.stepsCount, 3);
  assert.equal(initialState.donateLinkHref, '/apps/nuoi-toi/');
  assert.equal(initialState.hasTechnicalLeak, false, 'Visible UI must never expose affiliate_id, Sub ID, or an_redir');
  assert.equal(initialState.historyHidden, true);
  console.log('✔ Initial Shop Mòe storefront state & Tiệm Mòe topbar link verified');

  // 2. Single bare product link -> Checkout Ticket (Vé Chốt Đơn)
  const singleRes = await evaluate(`
    const input = document.getElementById('raw-input');
    input.value = 'https://shopee.vn/B%C3%A0n-Ph%C3%ADm-C%C6%A1-Kh%C3%B4ng-D%C3%A2y-Aula-F75-i.88201679.2147891023?sp_atk=trash&utm_source=an_999';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('convert-btn').click();
    await new Promise((r) => setTimeout(r, 180));
    const bodyText = document.body.innerText;
    return {
      isTicketCard: document.getElementById('result-section').classList.contains('ticket-card'),
      productTitle: document.getElementById('ticket-product-title')?.textContent.trim(),
      openHref: document.getElementById('open-shopee-btn')?.getAttribute('href'),
      openText: document.getElementById('open-shopee-btn')?.innerText.trim(),
      brandBtnCount: document.querySelectorAll('.btn-brand').length,
      hasCopyBtn: Boolean(document.getElementById('copy-single-btn')),
      historyVisible: !document.getElementById('history-section').classList.contains('is-hidden'),
      historyCount: document.getElementById('history-count-badge').textContent.trim(),
      hasTechnicalLeak: /affiliate[_\\s-]*id|17360400567|sub[_\\s-]*id|an_redir/i.test(bodyText),
    };
  `);
  const expectedSingle =
    'https://s.shopee.vn/an_redir?origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F88201679%2F2147891023&affiliate_id=17360400567';
  assert.equal(singleRes.isTicketCard, true);
  assert.equal(singleRes.productTitle, 'Bàn Phím Cơ Không Dây Aula F75');
  assert.equal(singleRes.openHref, expectedSingle);
  assert.match(singleRes.openText, /Mở Shopee & Chốt đơn ngay/);
  assert.equal(singleRes.brandBtnCount, 1, 'Only #open-shopee-btn should have primary .btn-brand styling');
  assert.equal(singleRes.hasCopyBtn, true);
  assert.equal(singleRes.historyVisible, true);
  assert.equal(singleRes.historyCount, '1');
  assert.equal(singleRes.hasTechnicalLeak, false, 'Ticket view must keep technical URL hidden');
  await capture('01-desktop-ticket-light');
  console.log('✔ Single-item Checkout Ticket & sole primary CTA verified');

  // 3. Shopee mobile share prose with 1 link -> still renders Single Checkout Ticket with extracted title
  const mobileShareRes = await evaluate(`
    const input = document.getElementById('raw-input');
    input.value = 'Hãy mua ngay sản phẩm Tai nghe chống ồn Sony WH-1000XM5 chính hãng với giá ưu đãi chỉ ₫5.990.000 trên Shopee! https://shopee.vn/product/88201679/99887766';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('convert-btn').click();
    await new Promise((r) => setTimeout(r, 180));
    return {
      isTicketCard: document.getElementById('result-section').classList.contains('ticket-card'),
      productTitle: document.getElementById('ticket-product-title')?.textContent.trim(),
      openHref: document.getElementById('open-shopee-btn')?.getAttribute('href'),
      historyCount: document.getElementById('history-count-badge').textContent.trim(),
    };
  `);
  assert.equal(mobileShareRes.isTicketCard, true);
  assert.equal(mobileShareRes.productTitle, 'Tai nghe chống ồn Sony WH-1000XM5 chính hãng');
  assert.equal(
    mobileShareRes.openHref,
    'https://s.shopee.vn/an_redir?origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F88201679%2F99887766&affiliate_id=17360400567',
  );
  assert.equal(mobileShareRes.historyCount, '2');
  console.log('✔ Shopee mobile share prose -> Single Ticket verified');

  // 4. Mobile responsive check on Single Ticket (Light & Dark) + Tablet + Multi-item Basket
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await evaluate(`window.scrollTo(0, 0);`);
  const mobileLightOverflow = await evaluate(`
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  `);
  assert.equal(mobileLightOverflow, false, 'Mobile 390x844 must have zero horizontal overflow');
  await capture('02-mobile-ticket-light');

  // Compact mobile 360x780 check
  await send('Emulation.setDeviceMetricsOverride', {
    width: 360,
    height: 780,
    deviceScaleFactor: 2,
    mobile: true,
  });
  const compactOverflow = await evaluate(`
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  `);
  assert.equal(compactOverflow, false, 'Compact mobile 360x780 must have zero horizontal overflow');

  // Tablet 768x1024 check
  await send('Emulation.setDeviceMetricsOverride', {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    mobile: false,
  });
  const tabletOverflow = await evaluate(`
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  `);
  assert.equal(tabletOverflow, false, 'Tablet 768x1024 must have zero horizontal overflow');

  // 5. Multi-item Shopping Basket + Dark Mode on Desktop
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1100,
    height: 920,
    deviceScaleFactor: 2,
    mobile: false,
  });
  const multiRes = await evaluate(`
    document.getElementById('theme-toggle-btn').click();
    const input = document.getElementById('raw-input');
    input.value = 'Combo góc làm việc êm ái:\\n- Kê tay gỗ óc chó: https://shopee.vn/product/101/202?utm_source=old\\n- Chuột không dây Logitech: https://shopee.vn/Chuot-Logitech-Silent-i.303.404\\nXem video tại https://youtu.be/abc123 nhé!';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('convert-btn').click();
    await new Promise((r) => setTimeout(r, 180));
    window.scrollTo(0, 0);
    const buyLinks = [...document.querySelectorAll('#multi-basket-list a')].map((a) => a.getAttribute('href'));
    return {
      isDark: document.documentElement.classList.contains('dark'),
      basketCount: document.querySelectorAll('#multi-basket-list .basket-row').length,
      buyLinks,
      hasCopyAll: Boolean(document.getElementById('copy-all-btn')),
      historyCount: document.getElementById('history-count-badge').textContent.trim(),
      hasTechnicalLeak: /affiliate[_\\s-]*id|17360400567|sub[_\\s-]*id|an_redir/i.test(document.body.innerText),
    };
  `);
  assert.equal(multiRes.isDark, true);
  assert.equal(multiRes.basketCount, 2);
  assert.equal(multiRes.buyLinks.length, 2);
  assert.ok(multiRes.buyLinks[0].includes('origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F101%2F202&affiliate_id=17360400567'));
  assert.ok(multiRes.buyLinks[1].includes('origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F303%2F404&affiliate_id=17360400567'));
  assert.equal(multiRes.hasCopyAll, true);
  assert.equal(multiRes.historyCount, '3');
  assert.equal(multiRes.hasTechnicalLeak, false);
  await capture('03-desktop-basket-dark');

  // Mobile dark check
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  const mobileDarkOverflow = await evaluate(`
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  `);
  assert.equal(mobileDarkOverflow, false, 'Mobile dark mode must have zero horizontal overflow');
  await capture('04-mobile-basket-dark');
  console.log('✔ Multi-item basket, dark mode & Desktop/Tablet/Mobile responsiveness verified');

  assert.deepEqual(exceptions, [], `Uncaught browser exceptions: ${exceptions.join('; ')}`);
  ws.close();
} catch (err) {
  console.error('✘ E2E failed:', err);
  exitCode = 1;
} finally {
  chrome.kill('SIGKILL');
  server.close();
  rmSync(profile, { recursive: true, force: true });
}

process.exit(exitCode);
