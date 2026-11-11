// Core Shopee -> Shopee Affiliate conversion engine (pure client-side `an_redir`).

const AFFILIATE_ID = '17360400567';
const AN_REDIR_ENDPOINT = 'https://s.shopee.vn/an_redir';

const LANDING_HOSTS = new Set(['shopee.vn', 'www.shopee.vn', 'm.shopee.vn']);
const SHORT_HOSTS = new Set(['s.shopee.vn', 'vn.shp.ee', 'shp.ee', 'shope.ee', 'www.shp.ee', 'www.shope.ee']);
const NON_BUYER_SHOPEE_HOSTS = new Set([
  'affiliate.shopee.vn',
  'seller-affiliate.shopee.vn',
  'banhang.shopee.vn',
  'help.shopee.vn',
  'doitac.shopee.vn',
]);

const SEARCH_ALLOWED_PARAMS = new Set(['keyword', 'catId', 'Facet', 'page', 'sortBy', 'order', 'locations', 'minPrice', 'maxPrice', 'ratingFilter']);

const URL_CANDIDATE_RE = /https?:\/\/[^\s<>"[\]]+|(?<![a-zA-Z0-9._-])(?:(?:www|m|s|vn)\.)?(?:shopee\.vn|shp\.ee|shope\.ee)\/[^\s<>"[\]]*/gi;

const shortUrlCache = new Map();

function countChar(str, ch) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === ch) count++;
  }
  return count;
}

/**
 * Splits trailing sentence punctuation off a URL token while preserving balanced parentheses/brackets
 * (e.g. `https://shopee.vn/Áo-(Mới)-i.1.2` keeps `)`, whereas `(https://shopee.vn/product/1/2)` drops `)`).
 */
export function splitTrailingPunctuation(rawToken) {
  let urlPart = rawToken;
  let trailing = '';

  while (urlPart.length > 0) {
    const last = urlPart[urlPart.length - 1];
    if (',.;:!?\'"”’»'.includes(last)) {
      trailing = last + trailing;
      urlPart = urlPart.slice(0, -1);
      continue;
    }
    if (last === ')' && countChar(urlPart, ')') > countChar(urlPart, '(')) {
      trailing = last + trailing;
      urlPart = urlPart.slice(0, -1);
      continue;
    }
    if (last === ']' && countChar(urlPart, ']') > countChar(urlPart, '[')) {
      trailing = last + trailing;
      urlPart = urlPart.slice(0, -1);
      continue;
    }
    if (last === '}' && countChar(urlPart, '}') > countChar(urlPart, '{')) {
      trailing = last + trailing;
      urlPart = urlPart.slice(0, -1);
      continue;
    }
    break;
  }

  return { urlPart, trailing };
}

function parseUrlSafely(rawUrl) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

function extractProductIds(pathname) {
  // 1. `/product/{shopid}/{itemid}`
  const directMatch = pathname.match(/^\/product\/(\d+)\/(\d+)(?:\/|$)/i);
  if (directMatch) {
    return { shopId: directMatch[1], itemId: directMatch[2] };
  }

  // 2. `/<slug>-i.{shopid}.{itemid}` or `/i.{shopid}.{itemid}`
  const slugMatch = pathname.match(/(?:^\/|-)i\.(\d+)\.(\d+)(?:\/|$)/i);
  if (slugMatch) {
    return { shopId: slugMatch[1], itemId: slugMatch[2] };
  }

  return null;
}

function describeOrigin(originUrl, itemType) {
  try {
    const u = new URL(originUrl);
    const prod = extractProductIds(u.pathname);
    if (prod) {
      return `Sản phẩm #${prod.itemId}`;
    }
    const cleanPath = decodeURIComponent(u.pathname).replace(/^\/+|\/+$/g, '');
    if (!cleanPath) return 'Trang chủ Shopee';
    if (itemType === 'shop') {
      return `Gian hàng ${cleanPath.replace(/^shop\//i, '#')}`;
    }
    return `shopee.vn/${cleanPath.length > 42 ? `${cleanPath.slice(0, 39)}…` : cleanPath}`;
  } catch {
    return originUrl;
  }
}

/**
 * Classifies and normalizes a single candidate Shopee URL synchronously.
 * Unwraps nested `an_redir?origin_link=...` and `universal-link` wrappers up to 4 levels deep.
 */
export function normalizeShopeeOrigin(rawUrl, depth = 0) {
  if (depth > 4) {
    return { kind: 'invalid', reason: 'Liên kết chuyển hướng lồng nhau quá nhiều tầng.' };
  }

  const parsed = parseUrlSafely(rawUrl);
  if (!parsed) {
    return { kind: 'invalid', reason: 'Định dạng đường dẫn không hợp lệ.' };
  }

  const host = parsed.hostname.toLowerCase();

  if (NON_BUYER_SHOPEE_HOSTS.has(host)) {
    return { kind: 'invalid', reason: 'Đây là trang quản trị hoặc hỗ trợ Shopee, không phải liên kết mua sắm.' };
  }

  // Existing `an_redir` link (e.g. `https://s.shopee.vn/an_redir?origin_link=...`)
  if ((SHORT_HOSTS.has(host) || host.endsWith('.shopee.vn')) && /^\/an_redir\/?$/i.test(parsed.pathname)) {
    const nestedOrigin = parsed.searchParams.get('origin_link');
    if (!nestedOrigin) {
      return { kind: 'invalid', reason: 'Liên kết tiếp thị thiếu thông tin trang đích (origin_link).' };
    }
    let decoded = nestedOrigin;
    try {
      if (!/^https?:\/\//i.test(decoded) && /%2f/i.test(decoded)) {
        decoded = decodeURIComponent(decoded);
      }
    } catch {
      // keep raw searchParam value
    }
    return normalizeShopeeOrigin(decoded, depth + 1);
  }

  // Short Shopee links (`s.shopee.vn/xxxx`, `vn.shp.ee/xxxx`, `shp.ee/xxxx`, `shope.ee/xxxx`)
  if (SHORT_HOSTS.has(host)) {
    const slug = parsed.pathname.replace(/^\/+|\/+$/g, '');
    if (!slug) {
      return { kind: 'invalid', reason: 'Liên kết rút gọn Shopee bị thiếu mã định danh.' };
    }
    return { kind: 'short', shortUrl: `https://${host}/${slug}${parsed.search}` };
  }

  // Standard Shopee Vietnam buyer landing pages
  if (LANDING_HOSTS.has(host)) {
    let pathname = parsed.pathname || '/';

    // Unwrap `/universal-link` wrapper paths or `?redir=...`
    if (/^\/universal-link(\/|$)/i.test(pathname)) {
      const redir = parsed.searchParams.get('redir') || parsed.searchParams.get('origin_link');
      if (redir) {
        return normalizeShopeeOrigin(redir, depth + 1);
      }
      pathname = pathname.replace(/^\/universal-link/i, '') || '/';
    }

    // 1. Product page with numeric shopId & itemId -> canonical short product path
    const productIds = extractProductIds(pathname);
    if (productIds) {
      const originUrl = `https://shopee.vn/product/${productIds.shopId}/${productIds.itemId}`;
      return {
        kind: 'origin',
        originUrl,
        itemType: 'product',
        label: describeOrigin(originUrl, 'product'),
      };
    }

    // 2. Search page -> preserve only functional filter params, strip all tracking
    if (/^\/search\/?$/i.test(pathname)) {
      const cleanParams = new URLSearchParams();
      for (const [k, v] of parsed.searchParams.entries()) {
        if (SEARCH_ALLOWED_PARAMS.has(k) && v !== '') {
          cleanParams.set(k, v);
        }
      }
      const qs = cleanParams.toString();
      const originUrl = `https://shopee.vn/search${qs ? `?${qs}` : ''}`;
      return {
        kind: 'origin',
        originUrl,
        itemType: 'page',
        label: cleanParams.get('keyword') ? `Tìm kiếm "${cleanParams.get('keyword')}"` : 'Trang tìm kiếm Shopee',
      };
    }

    // 3. Shop product format `/<shop_username>/<itemid>` or Shop / Campaign / Homepage
    const normalizedPath = pathname.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
    if (!normalizedPath || normalizedPath === '') {
      return {
        kind: 'origin',
        originUrl: 'https://shopee.vn',
        itemType: 'page',
        label: 'Trang chủ Shopee',
      };
    }

    const segments = normalizedPath.slice(1).split('/');
    let itemType = 'page';
    if (
      (segments.length === 1 && !['m', 'mall', 'flash_sale', 'campaigns', 'buyer', 'user', 'cart', 'blog'].includes(segments[0].toLowerCase())) ||
      (segments.length === 2 && segments[0].toLowerCase() === 'shop' && /^\d+$/.test(segments[1]))
    ) {
      itemType = 'shop';
    } else if (segments.length === 2 && /^\d{6,}$/.test(segments[1]) && segments[0].toLowerCase() !== 'm') {
      itemType = 'product';
    }

    const originUrl = `https://shopee.vn${normalizedPath}`;
    return {
      kind: 'origin',
      originUrl,
      itemType,
      label: describeOrigin(originUrl, itemType),
    };
  }

  // Other Shopee regional domains (e.g. shopee.sg, shopee.com.my)
  if (/(^|\.)shopee\.[a-z.]+$/i.test(host)) {
    return { kind: 'invalid', reason: `Chỉ hỗ trợ gian hàng Shopee Việt Nam (phát hiện tên miền ${host}).` };
  }

  return { kind: 'external' };
}

/**
 * Builds the Shopee Affiliate redirect link for a clean Origin Link.
 */
export function buildAffiliateUrl(originUrl) {
  return `${AN_REDIR_ENDPOINT}?origin_link=${encodeURIComponent(originUrl)}&affiliate_id=${AFFILIATE_ID}`;
}

function extractShopeeUrlFromHtml(html) {
  if (!html || typeof html !== 'string') return null;

  // Look for `an_redir?origin_link=...`, canonical/og:url, or product URL inside page markup
  const patterns = [
    /https?:\/\/s\.shopee\.vn\/an_redir\?[^\s"'<>]+/i,
    /<link[^>]+rel=["']canonical["'][^>]+href=["'](https?:\/\/shopee\.vn\/[^"']+)["']/i,
    /<meta[^>]+property=["']og:url["'][^>]+content=["'](https?:\/\/shopee\.vn\/[^"']+)["']/i,
    /https?:\/\/shopee\.vn\/(?:product\/\d+\/\d+|[^\s"'<>]*-i\.\d+\.\d+)/i,
    /https?:\/\/shopee\.vn\/[^\s"'<>]+/i,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m) {
      const candidate = (m[1] || m[0]).replace(/&amp;/g, '&');
      const norm = normalizeShopeeOrigin(candidate);
      if (norm.kind === 'origin') return candidate;
    }
  }
  return null;
}

/**
 * Resolves a Shopee short URL (`vn.shp.ee`, `s.shopee.vn`, `shp.ee`, `shope.ee`) in browser environments
 * using public CORS-friendly redirect resolvers with short timeouts and in-memory caching.
 */
export async function defaultResolveShortUrl(shortUrl, { fetchImpl = globalThis.fetch, timeoutMs = 6500 } = {}) {
  if (shortUrlCache.has(shortUrl)) {
    return shortUrlCache.get(shortUrl);
  }
  if (typeof fetchImpl !== 'function') {
    throw new Error('Trình duyệt không hỗ trợ kết nối giải mã liên kết rút gọn.');
  }

  const fetchJsonOrText = async (endpoint, parse) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json, text/plain, */*' },
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const text = await res.text();
      return parse(text, res);
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  };

  const resolvers = [
    // 1. unshorten.me JSON API
    () =>
      fetchJsonOrText(`https://unshorten.me/json/${encodeURIComponent(shortUrl)}`, (text) => {
        const data = JSON.parse(text);
        if (data && data.resolved_url && data.resolved_url !== shortUrl) {
          return data.resolved_url;
        }
        return null;
      }),
    // 2. AllOrigins wrapper (exposes final redirected URL in `status.url` and body in `contents`)
    () =>
      fetchJsonOrText(`https://api.allorigins.win/get?url=${encodeURIComponent(shortUrl)}`, (text) => {
        const data = JSON.parse(text);
        const finalUrl = data?.status?.url;
        if (finalUrl && normalizeShopeeOrigin(finalUrl).kind === 'origin') {
          return finalUrl;
        }
        return extractShopeeUrlFromHtml(data?.contents);
      }),
    // 3. CodeTabs proxy fallback (scans redirected markup)
    () =>
      fetchJsonOrText(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(shortUrl)}`, (text) =>
        extractShopeeUrlFromHtml(text),
      ),
  ];

  for (const runResolver of resolvers) {
    const candidate = await runResolver();
    if (candidate) {
      const check = normalizeShopeeOrigin(candidate);
      if (check.kind === 'origin') {
        shortUrlCache.set(shortUrl, check.originUrl);
        return check.originUrl;
      }
    }
  }

  throw new Error(
    'Không tự giải mã được liên kết rút gọn do giới hạn trình duyệt. Hãy mở liên kết gốc để sao chép đường dẫn đầy đủ trên shopee.vn.',
  );
}

export function clearShortUrlCache() {
  shortUrlCache.clear();
}

/**
 * Scans `rawInput`, cleans and converts every Shopee URL inline while preserving non-Shopee URLs and prose.
 */
export async function convertInput(rawInput, { resolveShortUrl = defaultResolveShortUrl } = {}) {
  const source = String(rawInput ?? '');
  if (!source.trim()) {
    return {
      mode: 'empty',
      isSingleBareLink: false,
      outputText: '',
      items: [],
      convertedCount: 0,
      errorCount: 0,
    };
  }

  // Collect candidate matches with exact character offsets
  const matches = [];
  URL_CANDIDATE_RE.lastIndex = 0;
  let match;
  while ((match = URL_CANDIDATE_RE.exec(source)) !== null) {
    const { urlPart, trailing } = splitTrailingPunctuation(match[0]);
    if (!urlPart) continue;
    const initial = normalizeShopeeOrigin(urlPart);
    if (initial.kind === 'external') continue;
    matches.push({
      start: match.index,
      end: match.index + urlPart.length,
      trailing,
      rawToken: urlPart,
      initial,
    });
  }

  if (matches.length === 0) {
    return {
      mode: 'none',
      isSingleBareLink: false,
      outputText: source,
      items: [],
      convertedCount: 0,
      errorCount: 0,
    };
  }

  // Deduplicate short-URL lookups across the same input batch
  const shortLookupPromises = new Map();
  for (const m of matches) {
    if (m.initial.kind === 'short' && !shortLookupPromises.has(m.initial.shortUrl)) {
      shortLookupPromises.set(
        m.initial.shortUrl,
        Promise.resolve()
          .then(() => resolveShortUrl(m.initial.shortUrl))
          .then(
            (resolved) => ({ ok: true, resolved }),
            (err) => ({ ok: false, message: err?.message || 'Không thể giải mã liên kết rút gọn.' }),
          ),
      );
    }
  }

  const items = [];
  let cursor = 0;
  let outputText = '';

  for (const m of matches) {
    outputText += source.slice(cursor, m.start);
    let finalOrigin = m.initial;

    if (m.initial.kind === 'short') {
      const outcome = await shortLookupPromises.get(m.initial.shortUrl);
      if (outcome.ok) {
        const postCheck = normalizeShopeeOrigin(outcome.resolved);
        if (postCheck.kind === 'origin') {
          finalOrigin = postCheck;
        } else {
          finalOrigin = {
            kind: 'invalid',
            reason: 'Liên kết rút gọn không trỏ tới trang mua sắm hợp lệ trên shopee.vn.',
          };
        }
      } else {
        finalOrigin = { kind: 'invalid', reason: outcome.message, isUnresolvedShort: true };
      }
    }

    if (finalOrigin.kind === 'origin') {
      const affiliateUrl = buildAffiliateUrl(finalOrigin.originUrl);
      outputText += affiliateUrl;
      items.push({
        originalUrl: m.rawToken,
        status: 'converted',
        originUrl: finalOrigin.originUrl,
        affiliateUrl,
        itemType: finalOrigin.itemType,
        label: finalOrigin.label,
      });
    } else {
      outputText += m.rawToken;
      items.push({
        originalUrl: m.rawToken,
        status: 'error',
        isUnresolvedShort: Boolean(finalOrigin.isUnresolvedShort),
        errorMessage: finalOrigin.reason || 'Liên kết Shopee không hợp lệ.',
      });
    }

    cursor = m.end;
  }

  outputText += source.slice(cursor);

  const convertedCount = items.filter((i) => i.status === 'converted').length;
  const errorCount = items.length - convertedCount;

  const trimmedSource = source.trim();
  const onlyMatch = matches.length === 1 ? matches[0] : null;
  const isSingleBareLink = Boolean(onlyMatch && trimmedSource === onlyMatch.rawToken);

  return {
    mode: isSingleBareLink ? 'single' : 'multi',
    isSingleBareLink,
    outputText: isSingleBareLink && items[0]?.status === 'converted' ? items[0].affiliateUrl : outputText,
    items,
    convertedCount,
    errorCount,
  };
}
