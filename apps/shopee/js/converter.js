// Core Shopee -> Shop Mòe Support Link engine (pure client-side `an_redir`).

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

const SEARCH_ALLOWED_PARAMS = new Set([
  'keyword',
  'catId',
  'Facet',
  'page',
  'sortBy',
  'order',
  'locations',
  'minPrice',
  'maxPrice',
  'ratingFilter',
]);

const URL_CANDIDATE_RE =
  /https?:\/\/[^\s<>"[\]]+|(?<![a-zA-Z0-9._-])(?:(?:www|m|s|vn)\.)?(?:shopee\.vn|shp\.ee|shope\.ee)\/[^\s<>"[\]]*/gi;

const shortUrlCache = new Map();
const shortUrlTitleCache = new Map();

function countChar(str, ch) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === ch) count++;
  }
  return count;
}

/**
 * Splits trailing sentence punctuation off a URL token while preserving balanced parentheses/brackets.
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
  const directMatch = pathname.match(/^\/product\/(\d+)\/(\d+)(?:\/|$)/i);
  if (directMatch) {
    return { shopId: directMatch[1], itemId: directMatch[2], slugTitle: null };
  }

  const slugMatch = pathname.match(/^\/(.*?)(?:^|-|\/)i\.(\d+)\.(\d+)(?:\/|$)/i);
  if (slugMatch) {
    const rawSlug = slugMatch[1] || '';
    const slugTitle = formatProductSlug(rawSlug);
    return { shopId: slugMatch[2], itemId: slugMatch[3], slugTitle };
  }

  return null;
}

/**
 * Converts a Shopee product URL slug (e.g. `%C3%81o-Thun-Nam-Form-R%E1%BB%99ng`) into a clean readable title.
 */
export function formatProductSlug(rawSlug) {
  if (!rawSlug) return null;
  let decoded = rawSlug;
  try {
    decoded = decodeURIComponent(rawSlug);
  } catch {
    // keep raw slug if malformed percent-encoding
  }
  const cleaned = decoded
    .replace(/^\/+|\/+$/g, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length < 2 || /^product$/i.test(cleaned)) {
    return null;
  }
  return cleaned.length > 96 ? `${cleaned.slice(0, 93).trim()}…` : cleaned;
}

/**
 * Extracts a human-friendly product title from Shopee mobile share prose preceding a link, e.g.:
 * "Hãy mua ngay sản phẩm Bàn phím cơ không dây với giá ưu đãi chỉ ₫699.000 trên Shopee! https://vn.shp.ee/..."
 */
export function extractTitleFromShareProse(proseBeforeUrl) {
  if (!proseBeforeUrl) return null;
  const lines = String(proseBeforeUrl)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  let candidate = lines[lines.length - 1];

  const markdownLinkMatch = candidate.match(/\[([^\]]+)\]\(\s*$/);
  if (markdownLinkMatch) {
    candidate = markdownLinkMatch[1];
  }

  // Strip common Shopee share prefixes
  candidate = candidate
    .replace(/^(?:hãy\s+)?(?:mua|xem|săn|đặt|chốt)\s+ngay(?:\s+sản\s+phẩm)?\s+/i, '')
    .replace(/^(?:mua|sản\s+phẩm|món|link\s+mua|đặt\s+mua)\s*[:\-–—]?\s+/i, '');

  // Strip trailing Shopee share boilerplate ("với giá...", "mua ngay trên Shopee!", trailing prepositions)
  candidate = candidate
    .replace(/\s+(?:với\s+giá|giá\s+ưu\s+đãi|giá\s+chỉ|chỉ\s+từ|chỉ\s+còn)(?=\s|$|[.,!?:;₫]).*$/i, '')
    .replace(/\.\s*mua\s+ngay\s+trên\s+shopee!?.*$/i, '')
    .replace(/\s+(?:trên|tại|ở)\s+shopee!?.*$/i, '')
    .replace(/\s+(?:tại\s+đây|ở\s+đây|tại|link)\s*[:\-–—]?\s*$/i, '')
    .replace(/^[\s\-–—•*#\d.)([\]{}"“']+/, '')
    .replace(/[\s\-–—:|•,!.?)([\]{}"”']+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!candidate || candidate.length < 3 || /^https?:\/\//i.test(candidate)) {
    return null;
  }
  return candidate.length > 96 ? `${candidate.slice(0, 93).trim()}…` : candidate;
}

function describeOrigin(originUrl, itemType, slugTitle = null) {
  if (slugTitle) return slugTitle;
  try {
    const u = new URL(originUrl);
    const prod = extractProductIds(u.pathname);
    if (prod) {
      return prod.slugTitle || 'Món hàng bạn chọn trên Shopee';
    }
    const cleanPath = decodeURIComponent(u.pathname).replace(/^\/+|\/+$/g, '');
    if (!cleanPath) return 'Trang chủ Shopee Việt Nam';
    if (itemType === 'shop') {
      return `Gian hàng ${cleanPath.replace(/^shop\//i, '#')}`;
    }
    return ` Sự kiện / Trang Shopee (${cleanPath.length > 36 ? `${cleanPath.slice(0, 33)}…` : cleanPath})`.trim();
  } catch {
    return 'Món hàng trên Shopee';
  }
}

/**
 * Classifies and normalizes a single candidate Shopee URL synchronously.
 * Unwraps nested `an_redir?origin_link=...` and `universal-link` wrappers up to 4 levels deep.
 */
export function normalizeShopeeOrigin(rawUrl, depth = 0) {
  if (depth > 4) {
    return { kind: 'invalid', reason: 'Đường dẫn chuyển hướng lồng nhau quá nhiều tầng.' };
  }

  const parsed = parseUrlSafely(rawUrl);
  if (!parsed) {
    return { kind: 'invalid', reason: 'Định dạng đường dẫn chưa đúng.' };
  }

  const host = parsed.hostname.toLowerCase();

  if (NON_BUYER_SHOPEE_HOSTS.has(host)) {
    return { kind: 'invalid', reason: 'Đây là trang quản trị Shopee, không phải trang mua hàng.' };
  }

  // Existing `an_redir` link
  if ((SHORT_HOSTS.has(host) || host.endsWith('.shopee.vn')) && /^\/an_redir\/?$/i.test(parsed.pathname)) {
    const nestedOrigin = parsed.searchParams.get('origin_link');
    if (!nestedOrigin) {
      return { kind: 'invalid', reason: 'Đường dẫn bị thiếu thông tin món hàng gốc.' };
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
      return { kind: 'invalid', reason: 'Liên kết rút gọn Shopee bị thiếu mã sản phẩm.' };
    }
    return { kind: 'short', shortUrl: `https://${host}/${slug}${parsed.search}` };
  }

  // Standard Shopee Vietnam buyer landing pages
  if (LANDING_HOSTS.has(host)) {
    let pathname = parsed.pathname || '/';

    if (/^\/universal-link(\/|$)/i.test(pathname)) {
      const redir = parsed.searchParams.get('redir') || parsed.searchParams.get('origin_link');
      if (redir) {
        return normalizeShopeeOrigin(redir, depth + 1);
      }
      pathname = pathname.replace(/^\/universal-link/i, '') || '/';
    }

    // 1. Product page with numeric shopId & itemId
    const productIds = extractProductIds(pathname);
    if (productIds) {
      const originUrl = `https://shopee.vn/product/${productIds.shopId}/${productIds.itemId}`;
      return {
        kind: 'origin',
        originUrl,
        itemId: productIds.itemId,
        shopId: productIds.shopId,
        itemType: 'product',
        hasCustomTitle: Boolean(productIds.slugTitle),
        label: describeOrigin(originUrl, 'product', productIds.slugTitle),
      };
    }

    // 2. Search page
    if (/^\/search\/?$/i.test(pathname)) {
      const cleanParams = new URLSearchParams();
      for (const [k, v] of parsed.searchParams.entries()) {
        if (SEARCH_ALLOWED_PARAMS.has(k) && v !== '') {
          cleanParams.set(k, v);
        }
      }
      const qs = cleanParams.toString();
      const originUrl = `https://shopee.vn/search${qs ? `?${qs}` : ''}`;
      const kw = cleanParams.get('keyword');
      return {
        kind: 'origin',
        originUrl,
        itemType: 'page',
        hasCustomTitle: Boolean(kw),
        label: kw ? `Tìm kiếm "${kw}" trên Shopee` : 'Trang tìm kiếm Shopee',
      };
    }

    // 3. Shop product format `/<shop_username>/<itemid>` or Shop / Campaign / Homepage
    const normalizedPath = pathname.replace(/\/{2,}/g, '/').replace(/\/+$/, '');
    if (!normalizedPath || normalizedPath === '') {
      return {
        kind: 'origin',
        originUrl: 'https://shopee.vn',
        itemType: 'page',
        hasCustomTitle: true,
        label: 'Trang chủ Shopee Việt Nam',
      };
    }

    const segments = normalizedPath.slice(1).split('/');
    let itemType = 'page';
    if (
      (segments.length === 1 &&
        !['m', 'mall', 'flash_sale', 'campaigns', 'buyer', 'user', 'cart', 'blog'].includes(segments[0].toLowerCase())) ||
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
      hasCustomTitle: itemType === 'shop',
      label:
        itemType === 'product'
          ? `Món hàng tại gian hàng ${segments[0]}`
          : describeOrigin(originUrl, itemType),
    };
  }

  if (/(^|\.)shopee\.[a-z.]+$/i.test(host)) {
    return { kind: 'invalid', reason: `Shop Mòe hiện chỉ hỗ trợ Shopee Việt Nam (phát hiện ${host}).` };
  }

  return { kind: 'external' };
}

/**
 * Builds the Shopee Affiliate support link for a clean Origin Link.
 */
export function buildAffiliateUrl(originUrl) {
  return `${AN_REDIR_ENDPOINT}?origin_link=${encodeURIComponent(originUrl)}&affiliate_id=${AFFILIATE_ID}`;
}

function extractShopeeUrlFromHtml(html) {
  if (!html || typeof html !== 'string') return null;

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
 * Resolves a Shopee short URL (`vn.shp.ee`, `s.shopee.vn`, `shp.ee`, `shope.ee`) in browser environments.
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
    () =>
      fetchJsonOrText(`https://unshorten.me/json/${encodeURIComponent(shortUrl)}`, (text) => {
        const data = JSON.parse(text);
        if (data && data.resolved_url && data.resolved_url !== shortUrl) {
          return data.resolved_url;
        }
        return null;
      }),
    () =>
      fetchJsonOrText(`https://api.allorigins.win/get?url=${encodeURIComponent(shortUrl)}`, (text) => {
        const data = JSON.parse(text);
        const finalUrl = data?.status?.url;
        if (finalUrl && normalizeShopeeOrigin(finalUrl).kind === 'origin') {
          return finalUrl;
        }
        return extractShopeeUrlFromHtml(data?.contents);
      }),
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
        if (check.hasCustomTitle && check.label) {
          shortUrlTitleCache.set(shortUrl, check.label);
        }
        return check.originUrl;
      }
    }
  }

  throw new Error(
    'Trình duyệt chưa tự mở được link rút gọn này. Bạn hãy bấm mở link gốc sang Shopee rồi copy lại đường dẫn trên thanh địa chỉ nhé!',
  );
}

export function clearShortUrlCache() {
  shortUrlCache.clear();
  shortUrlTitleCache.clear();
}

/**
 * Scans `rawInput`, cleans and converts every Shopee URL inline while extracting friendly product names.
 */
export async function convertInput(rawInput, { resolveShortUrl = defaultResolveShortUrl } = {}) {
  const source = String(rawInput ?? '');
  if (!source.trim()) {
    return {
      mode: 'empty',
      isSingleBareLink: false,
      isSingleItem: false,
      outputText: '',
      items: [],
      convertedCount: 0,
      errorCount: 0,
    };
  }

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
      isSingleItem: false,
      outputText: source,
      items: [],
      convertedCount: 0,
      errorCount: 0,
    };
  }

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

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const prevEnd = i === 0 ? 0 : matches[i - 1].end;
    const proseSegmentBefore = source.slice(prevEnd, m.start);

    outputText += source.slice(cursor, m.start);
    let finalOrigin = m.initial;

    if (m.initial.kind === 'short') {
      const outcome = await shortLookupPromises.get(m.initial.shortUrl);
      if (outcome.ok) {
        const postCheck = normalizeShopeeOrigin(outcome.resolved);
        if (postCheck.kind === 'origin') {
          const cachedSlugTitle = shortUrlTitleCache.get(m.initial.shortUrl);
          finalOrigin =
            !postCheck.hasCustomTitle && cachedSlugTitle
              ? { ...postCheck, hasCustomTitle: true, label: cachedSlugTitle }
              : postCheck;
        } else {
          finalOrigin = {
            kind: 'invalid',
            reason: 'Liên kết rút gọn không trỏ tới món hàng hợp lệ trên Shopee.',
          };
        }
      } else {
        finalOrigin = { kind: 'invalid', reason: outcome.message, isUnresolvedShort: true };
      }
    }

    if (finalOrigin.kind === 'origin') {
      const affiliateUrl = buildAffiliateUrl(finalOrigin.originUrl);
      outputText += affiliateUrl;

      let displayLabel = finalOrigin.label;
      if (!finalOrigin.hasCustomTitle) {
        const proseTitle = extractTitleFromShareProse(proseSegmentBefore);
        if (proseTitle) {
          displayLabel = proseTitle;
        }
      }

      items.push({
        originalUrl: m.rawToken,
        status: 'converted',
        originUrl: finalOrigin.originUrl,
        itemId: finalOrigin.itemId || null,
        affiliateUrl,
        itemType: finalOrigin.itemType,
        label: displayLabel,
      });
    } else {
      outputText += m.rawToken;
      items.push({
        originalUrl: m.rawToken,
        status: 'error',
        isUnresolvedShort: Boolean(finalOrigin.isUnresolvedShort),
        errorMessage: finalOrigin.reason || 'Liên kết Shopee chưa hợp lệ.',
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
  const isSingleItem = items.length === 1;

  return {
    mode: isSingleItem ? 'single' : 'multi',
    isSingleBareLink,
    isSingleItem,
    outputText: isSingleBareLink && items[0]?.status === 'converted' ? items[0].affiliateUrl : outputText,
    items,
    convertedCount,
    errorCount,
  };
}
