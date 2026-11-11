import { convertInput } from './converter.js';
import { createHistoryStore } from './history.js';

const THEME_KEY = 'shopee_aff.theme';
const historyStore = createHistoryStore();

const rawInputEl = document.getElementById('raw-input');
const pasteBtn = document.getElementById('paste-btn');
const clearBtn = document.getElementById('clear-btn');
const convertBtn = document.getElementById('convert-btn');
const convertSpinner = document.getElementById('convert-spinner');
const convertIcon = document.getElementById('convert-icon');
const convertBtnText = document.getElementById('convert-btn-text');
const resultSection = document.getElementById('result-section');
const historySection = document.getElementById('history-section');
const historyCountBadge = document.getElementById('history-count-badge');
const historyListEl = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const toastRoot = document.getElementById('toast-root');

let activeJobId = 0;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message, variant = 'default') {
  const el = document.createElement('div');
  el.className = `toast animate-reveal${variant === 'error' ? ' toast--error' : ''}`;
  el.textContent = message;
  toastRoot.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }, 2200);
}

async function copyTextToClipboard(text, feedbackBtn = null, successMsg = 'Đã copy link mua hàng!') {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }

    if (feedbackBtn) {
      const labelSpan = feedbackBtn.querySelector('[data-copy-label]');
      if (labelSpan) {
        const prev = labelSpan.textContent;
        labelSpan.textContent = 'Đã copy!';
        feedbackBtn.disabled = true;
        setTimeout(() => {
          labelSpan.textContent = prev;
          feedbackBtn.disabled = false;
        }, 1400);
      }
    }
    showToast(successMsg);
    return true;
  } catch {
    showToast('Không thể tự động copy, vui lòng thử lại.', 'error');
    return false;
  }
}

function formatRelativeTime(timestamp) {
  const diffSec = Math.max(0, Math.floor((Date.now() - Number(timestamp || 0)) / 1000));
  if (diffSec < 45) return 'Vừa ghé xem';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return new Date(timestamp).toLocaleDateString('vi-VN');
}

function updateClearButtonVisibility() {
  const hasValue = rawInputEl.value.trim().length > 0;
  clearBtn.classList.toggle('is-hidden', !hasValue);
}

function setLoading(isLoading) {
  convertBtn.disabled = isLoading;
  convertSpinner.classList.toggle('is-hidden', !isLoading);
  convertIcon.classList.toggle('is-hidden', isLoading);
  convertBtnText.textContent = isLoading ? 'Mòe đang gắn bùa…' : 'Ghé qua Tiệm Mòe';
}

function scrollResultIntoComfortView() {
  requestAnimationFrame(() => {
    const rect = resultSection.getBoundingClientRect();
    if (rect.bottom > window.innerHeight || rect.top < 16) {
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

function renderEmptyMatchNotice() {
  resultSection.className = 'surface-card animate-reveal';
  resultSection.innerHTML = `
    <div class="status-banner">
      <div class="status-icon status-icon--warn" aria-hidden="true">
        <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="12" />
          <line x1="12" x2="12.01" y1="16" y2="16" />
        </svg>
      </div>
      <div class="status-body">
        <p class="status-title">Mòe chưa thấy link Shopee nào ở đây cả</p>
        <p class="status-desc">
          Bạn hãy mở món hàng trên ứng dụng Shopee, bấm <strong>Chia sẻ → Sao chép đường dẫn</strong> rồi dán lại vào ô trên nhé!
        </p>
      </div>
    </div>
  `;
}

function renderSingleTicket(item) {
  if (item.status === 'error') {
    const safeHref = item.originalUrl.startsWith('http') ? item.originalUrl : `https://${item.originalUrl}`;
    resultSection.className = 'surface-card animate-reveal';
    resultSection.innerHTML = `
      <div class="status-banner">
        <div class="status-icon status-icon--error" aria-hidden="true">
          <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6M9 9l6 6" />
          </svg>
        </div>
        <div class="status-body">
          <p class="status-title status-title--error">Mòe chưa mở được link rút gọn này</p>
          <p class="status-desc">${escapeHtml(item.errorMessage)}</p>
          ${
            item.isUnresolvedShort
              ? `<div class="status-cta">
                  <a
                    href="${escapeHtml(safeHref)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-secondary btn--sm"
                  >
                    <span>Mở món hàng trên Shopee để lấy link đầy đủ</span>
                    <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" x2="21" y1="14" y2="3" />
                    </svg>
                  </a>
                </div>`
              : ''
          }
        </div>
      </div>
    `;
    return;
  }

  resultSection.className = 'ticket-card animate-reveal';
  resultSection.innerHTML = `
    <div class="ticket-top">
      <span class="ticket-badge">
        <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
        <span>Đã gắn bùa chúc phúc của Mòe</span>
      </span>

      <h2 id="ticket-product-title" class="ticket-item-name">${escapeHtml(item.label)}</h2>
      <p class="ticket-assurance">
        Giá bán, mã Freeship và Shopee Xu của bạn vẫn được giữ nguyên 100% khi thanh toán.
      </p>
    </div>

    <div class="ticket-perforation" aria-hidden="true">
      <div class="ticket-dashed-line"></div>
    </div>

    <div class="ticket-bottom">
      <a
        id="open-shopee-btn"
        href="${escapeHtml(item.affiliateUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        class="btn btn-brand btn--xl cta-buy-full"
      >
        <svg class="icon-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <span>Mở Shopee &amp; Chốt đơn ngay</span>
        <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </a>

      <div class="ticket-sub-actions">
        <button id="copy-single-btn" type="button" class="subtle-link-btn">
          <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          <span data-copy-label>Copy link gửi bạn bè / mua sau</span>
        </button>
        <span class="subtle-dot" aria-hidden="true">·</span>
        <button id="pick-another-btn" type="button" class="subtle-link-btn">
          <span>Đổi sang món khác</span>
        </button>
      </div>
    </div>
  `;

  const copySingleBtn = document.getElementById('copy-single-btn');
  const pickAnotherBtn = document.getElementById('pick-another-btn');

  copySingleBtn?.addEventListener('click', () => {
    copyTextToClipboard(item.affiliateUrl, copySingleBtn, 'Đã copy link ủng hộ Mòe!');
  });

  pickAnotherBtn?.addEventListener('click', () => {
    rawInputEl.value = '';
    updateClearButtonVisibility();
    resultSection.classList.add('is-hidden');
    resultSection.innerHTML = '';
    rawInputEl.focus();
  });
}

function renderMultiBasket(res) {
  const rowsHtml = res.items
    .map((item, idx) => {
      if (item.status === 'converted') {
        return `
          <li class="basket-row">
            <div class="item-info">
              <p class="item-title">${escapeHtml(item.label)}</p>
              <p class="item-sub">Sẵn sàng mở trên Shopee · Giữ nguyên giá &amp; voucher</p>
            </div>
            <div class="row-actions">
              <button
                type="button"
                data-item-copy="${idx}"
                class="btn btn-secondary btn--xs"
                title="Copy link món này"
              >
                <span data-copy-label>Copy</span>
              </button>
              <a
                href="${escapeHtml(item.affiliateUrl)}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-brand btn--xs"
              >
                <span>Mở mua</span>
                <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </li>
        `;
      }

      const safeHref = item.originalUrl.startsWith('http') ? item.originalUrl : `https://${item.originalUrl}`;
      return `
        <li class="basket-row basket-row--error">
          <div class="item-info">
            <p class="item-title item-title--error">${escapeHtml(item.originalUrl)}</p>
            <p class="item-sub item-sub--wrap">${escapeHtml(item.errorMessage)}</p>
          </div>
          ${
            item.isUnresolvedShort
              ? `<div class="row-actions">
                  <a
                    href="${escapeHtml(safeHref)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-secondary btn--xs"
                  >
                    Mở gốc
                  </a>
                </div>`
              : ''
          }
        </li>
      `;
    })
    .join('');

  resultSection.className = 'surface-card animate-reveal';
  resultSection.innerHTML = `
    <div class="multi-header">
      <div class="multi-badges">
        <h2 class="section-heading">Giỏ đồ bạn vừa chọn</h2>
        ${res.convertedCount > 0 ? `<span class="chip chip--brand">${res.convertedCount} món sẵn sàng</span>` : ''}
        ${res.errorCount > 0 ? `<span class="chip chip--danger">${res.errorCount} link cần kiểm tra</span>` : ''}
      </div>

      ${
        res.convertedCount > 0
          ? `<button id="copy-all-btn" type="button" class="btn btn-secondary btn--xs">
              <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              <span data-copy-label>Copy cả danh sách</span>
            </button>`
          : ''
      }
    </div>

    <ul id="multi-basket-list" class="divided-list">${rowsHtml}</ul>
  `;

  const copyAllBtn = document.getElementById('copy-all-btn');
  copyAllBtn?.addEventListener('click', () => {
    copyTextToClipboard(res.outputText, copyAllBtn, 'Đã copy toàn bộ danh sách!');
  });

  resultSection.querySelectorAll('[data-item-copy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-item-copy'));
      const target = res.items[idx];
      if (target?.affiliateUrl) {
        copyTextToClipboard(target.affiliateUrl, btn);
      }
    });
  });
}

function renderHistory() {
  const entries = historyStore.list();
  if (entries.length === 0) {
    historySection.classList.add('is-hidden');
    historyListEl.innerHTML = '';
    return;
  }

  historySection.classList.remove('is-hidden');
  historyCountBadge.textContent = String(entries.length);

  historyListEl.innerHTML = entries
    .map(
      (entry) => `
      <li class="history-row">
        <button
          type="button"
          data-history-load="${escapeHtml(entry.id)}"
          class="history-load-btn"
          title="Nhấn để xem lại món này"
        >
          <span class="history-load-label">${escapeHtml(entry.label)}</span>
          <span class="history-meta">${escapeHtml(formatRelativeTime(entry.createdAt))}</span>
        </button>

        <div class="row-actions">
          ${
            entry.firstAffiliateUrl
              ? `<a
                  href="${escapeHtml(entry.firstAffiliateUrl)}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-soft-brand btn--xs"
                >
                  Mua ngay
                </a>`
              : ''
          }
          <button
            type="button"
            data-history-copy="${escapeHtml(entry.id)}"
            class="btn btn-secondary btn--xs"
            title="Copy link"
          >
            <span data-copy-label>Copy</span>
          </button>
          <button
            type="button"
            data-history-remove="${escapeHtml(entry.id)}"
            class="btn btn-secondary btn--icon-xs"
            aria-label="Xóa món này"
            title="Xóa khỏi danh sách"
          >
            <svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </li>
    `,
    )
    .join('');
}

async function runConversion({ silentEmpty = false, autoScroll = true } = {}) {
  const input = rawInputEl.value;
  if (!input.trim()) {
    if (!silentEmpty) {
      rawInputEl.focus();
      showToast('Bạn hãy dán link món hàng trên Shopee vào ô trước nhé!');
    } else {
      resultSection.classList.add('is-hidden');
      resultSection.innerHTML = '';
    }
    return;
  }

  const jobId = ++activeJobId;
  setLoading(true);

  try {
    const res = await convertInput(input);
    if (jobId !== activeJobId) return;

    if (res.mode === 'none') {
      renderEmptyMatchNotice();
      if (autoScroll) scrollResultIntoComfortView();
      return;
    }

    if (res.isSingleItem && res.items.length === 1) {
      renderSingleTicket(res.items[0]);
    } else {
      renderMultiBasket(res);
    }

    if (autoScroll) {
      scrollResultIntoComfortView();
    }

    if (res.convertedCount > 0) {
      const firstConverted = res.items.find((i) => i.status === 'converted');
      const summaryLabel =
        res.convertedCount === 1 && firstConverted
          ? firstConverted.label
          : `Giỏ ${res.convertedCount} món (${firstConverted?.label || 'Shopee'})`;

      historyStore.add({
        rawInput: input,
        outputText: firstConverted && res.isSingleItem ? firstConverted.affiliateUrl : res.outputText,
        label: summaryLabel,
        convertedCount: res.convertedCount,
        firstAffiliateUrl: firstConverted?.affiliateUrl || null,
        isSingleBareLink: res.isSingleBareLink,
        isSingleItem: res.isSingleItem,
      });
      renderHistory();
    }
  } finally {
    if (jobId === activeJobId) {
      setLoading(false);
    }
  }
}

// Event Listeners
rawInputEl.addEventListener('input', () => {
  updateClearButtonVisibility();
  if (!rawInputEl.value.trim()) {
    resultSection.classList.add('is-hidden');
    resultSection.innerHTML = '';
  }
});

rawInputEl.addEventListener('paste', () => {
  setTimeout(() => {
    updateClearButtonVisibility();
    runConversion({ silentEmpty: true, autoScroll: true });
  }, 0);
});

rawInputEl.addEventListener('keydown', (ev) => {
  if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') {
    ev.preventDefault();
    runConversion();
  }
});

convertBtn.addEventListener('click', () => {
  runConversion();
});

pasteBtn.addEventListener('click', async () => {
  try {
    if (!navigator.clipboard?.readText) {
      throw new Error('Clipboard API unavailable');
    }
    const clip = await navigator.clipboard.readText();
    if (!clip || !clip.trim()) {
      rawInputEl.focus();
      showToast('Bộ nhớ tạm đang trống, hãy copy link món hàng từ Shopee trước nhé!');
      return;
    }
    rawInputEl.value = clip;
    updateClearButtonVisibility();
    await runConversion({ autoScroll: true });
  } catch {
    rawInputEl.focus();
    showToast('Chạm giữ vào ô nhập (hoặc nhấn Ctrl+V) để dán link Shopee nhé!', 'error');
  }
});

clearBtn.addEventListener('click', () => {
  activeJobId++;
  setLoading(false);
  rawInputEl.value = '';
  updateClearButtonVisibility();
  resultSection.classList.add('is-hidden');
  resultSection.innerHTML = '';
  rawInputEl.focus();
});

historyListEl.addEventListener('click', (ev) => {
  const copyBtn = ev.target.closest('[data-history-copy]');
  if (copyBtn) {
    const id = copyBtn.getAttribute('data-history-copy');
    const entry = historyStore.list().find((item) => item.id === id);
    if (entry) copyTextToClipboard(entry.outputText, copyBtn);
    return;
  }

  const removeBtn = ev.target.closest('[data-history-remove]');
  if (removeBtn) {
    const id = removeBtn.getAttribute('data-history-remove');
    historyStore.remove(id);
    renderHistory();
    return;
  }

  const loadBtn = ev.target.closest('[data-history-load]');
  if (loadBtn) {
    const id = loadBtn.getAttribute('data-history-load');
    const entry = historyStore.list().find((item) => item.id === id);
    if (entry) {
      rawInputEl.value = entry.rawInput;
      updateClearButtonVisibility();
      runConversion({ autoScroll: true });
    }
  }
});

clearHistoryBtn.addEventListener('click', () => {
  historyStore.clear();
  renderHistory();
  showToast('Đã xóa danh sách món vừa ghé xem');
});

themeToggleBtn.addEventListener('click', () => {
  const isDark = document.documentElement.classList.toggle('dark');
  try {
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  } catch {
    // ignore storage errors
  }
});

// Initialize
renderHistory();
updateClearButtonVisibility();

const queryUrl =
  new URLSearchParams(window.location.search).get('url') ||
  new URLSearchParams(window.location.search).get('q');
if (queryUrl) {
  rawInputEl.value = queryUrl;
  updateClearButtonVisibility();
  runConversion({ silentEmpty: true, autoScroll: false });
}
