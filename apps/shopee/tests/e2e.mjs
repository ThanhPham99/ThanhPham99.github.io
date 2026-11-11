// End-to-end UI tests for apps/shopee using headless Chrome over CDP.
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
    '--window-size=1280,900',
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
    await sleep(250);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    if (shot.result?.data) {
      writeFileSync(join(shotDir, `${name}.png`), Buffer.from(shot.result.data, 'base64'));
    }
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1100,
    height: 860,
    deviceScaleFactor: 2,
    mobile: false,
  });

  await send('Page.navigate', { url: BASE });
  await sleep(1200);

  // 1. Initial UI assertions: no affiliate_id or Sub ID anywhere in visible text
  const initialState = await evaluate(`
    const bodyText = document.body.innerText;
    return {
      h1Count: document.querySelectorAll('h1').length,
      h1Text: document.querySelector('h1')?.textContent.trim(),
      hasAffiliateIdText: /affiliate[_\s-]*id|17360400567|sub[_\s-]*id/i.test(bodyText),
      historyHidden: document.getElementById('history-section').classList.contains('is-hidden'),
    };
  `);
  assert.equal(initialState.h1Count, 1);
  assert.equal(initialState.h1Text, 'Chuyển đổi Link Shopee');
  assert.equal(initialState.hasAffiliateIdText, false, 'Visible UI must not display affiliate_id or Sub ID');
  assert.equal(initialState.historyHidden, true);
  console.log('✔ Initial clean state verified');

  // 2. Single-link conversion
  const singleRes = await evaluate(`
    const input = document.getElementById('raw-input');
    input.value = 'https://shopee.vn/Ban-Phim-Co-Khong-Day-i.88201679.2147891023?sp_atk=trash&utm_source=an_999';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('convert-btn').click();
    await new Promise((r) => setTimeout(r, 150));
    return {
      outUrl: document.getElementById('single-output-url')?.value,
      openHref: document.getElementById('open-shopee-btn')?.getAttribute('href'),
      historyVisible: !document.getElementById('history-section').classList.contains('is-hidden'),
      historyCount: document.getElementById('history-count-badge').textContent.trim(),
      bodyHasSubId: /sub[_\s-]*id/i.test(document.body.innerText),
    };
  `);
  const expectedSingle =
    'https://s.shopee.vn/an_redir?origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F88201679%2F2147891023&affiliate_id=17360400567';
  assert.equal(singleRes.outUrl, expectedSingle);
  assert.equal(singleRes.openHref, expectedSingle);
  assert.equal(singleRes.historyVisible, true);
  assert.equal(singleRes.historyCount, '1');
  assert.equal(singleRes.bodyHasSubId, false);
  await capture('01-single-light');
  console.log('✔ Single-link conversion & history verified');

  // 3. Multi-link post conversion + dark mode
  const multiRes = await evaluate(`
    document.getElementById('theme-toggle-btn').click();
    const input = document.getElementById('raw-input');
    input.value = 'Gợi ý góc làm việc tối giản:\\n- Bàn phím cơ: https://shopee.vn/product/101/202?utm_source=old\\n- Chuột không dây: https://shopee.vn/Chuot-i.303.404\\nReview chi tiết tại https://youtu.be/abc123 nhé!';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    document.getElementById('convert-btn').click();
    await new Promise((r) => setTimeout(r, 150));
    return {
      isDark: document.documentElement.classList.contains('dark'),
      outText: document.getElementById('multi-output-text')?.value,
      historyCount: document.getElementById('history-count-badge').textContent.trim(),
    };
  `);
  assert.equal(multiRes.isDark, true);
  assert.ok(multiRes.outText.includes('origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F101%2F202&affiliate_id=17360400567'));
  assert.ok(multiRes.outText.includes('origin_link=https%3A%2F%2Fshopee.vn%2Fproduct%2F303%2F404&affiliate_id=17360400567'));
  assert.ok(multiRes.outText.includes('https://youtu.be/abc123'));
  assert.equal(multiRes.historyCount, '2');
  await capture('02-multi-dark');

  // 4. Mobile responsive check (390x844)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await evaluate(`document.getElementById('theme-toggle-btn').click();`);
  const hasHorizontalOverflow = await evaluate(`
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  `);
  assert.equal(hasHorizontalOverflow, false, 'Mobile viewport must have zero horizontal overflow');
  await capture('03-mobile-light');
  console.log('✔ Multi-link post conversion, dark mode & mobile responsiveness verified');

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
