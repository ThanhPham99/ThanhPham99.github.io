import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAffiliateUrl,
  clearShortUrlCache,
  convertInput,
  defaultResolveShortUrl,
  extractTitleFromShareProse,
  formatProductSlug,
  normalizeShopeeOrigin,
  splitTrailingPunctuation,
} from '../js/converter.js';

const EXPECTED_SUFFIX = '&affiliate_id=17360400567';

test('canonicalizes verbose Shopee product slug URLs, extracts readable title, and strips tracking params', () => {
  const raw =
    'https://shopee.vn/%C3%81o-Thun-Nam-Cotton-100-i.88201679.2147891023?sp_atk=9b21c&xptdk=11a&utm_source=an_999999999&uls_trackid=abc';
  const norm = normalizeShopeeOrigin(raw);
  assert.equal(norm.kind, 'origin');
  assert.equal(norm.itemType, 'product');
  assert.equal(norm.originUrl, 'https://shopee.vn/product/88201679/2147891023');
  assert.equal(norm.label, 'Áo Thun Nam Cotton 100');
  assert.equal(formatProductSlug('%C3%81o-Thun-Nam-Cotton-100'), 'Áo Thun Nam Cotton 100');

  const aff = buildAffiliateUrl(norm.originUrl);
  assert.equal(
    aff,
    `https://s.shopee.vn/an_redir?origin_link=${encodeURIComponent('https://shopee.vn/product/88201679/2147891023')}${EXPECTED_SUFFIX}`,
  );
  assert.ok(!aff.includes('sub_id'));
});

test('handles /product/{shopid}/{itemid}, shop URLs, campaign pages, and search queries', () => {
  assert.equal(
    normalizeShopeeOrigin('https://m.shopee.vn/product/111222/333444/?utm_medium=affiliates').originUrl,
    'https://shopee.vn/product/111222/333444',
  );
  assert.equal(
    normalizeShopeeOrigin('https://shopee.vn/apple_flagship_store?utm_campaign=sale').originUrl,
    'https://shopee.vn/apple_flagship_store',
  );
  assert.equal(
    normalizeShopeeOrigin('https://shopee.vn/m/voucher-xtra?mmp_pid=an_123').originUrl,
    'https://shopee.vn/m/voucher-xtra',
  );
  assert.equal(
    normalizeShopeeOrigin('https://shopee.vn/search?keyword=tai+nghe&utm_source=an_123&page=1').originUrl,
    'https://shopee.vn/search?keyword=tai+nghe&page=1',
  );
});

test('unwraps someone else’s an_redir link and legacy universal-link offline', () => {
  const otherAff =
    'https://s.shopee.vn/an_redir?origin_link=https%3A%2F%2Fshopee.vn%2FAo-khoac-i.12345.67890%3Futm_source%3Dan_111111&affiliate_id=999999999&sub_id=tiktok-video';
  const norm = normalizeShopeeOrigin(otherAff);
  assert.equal(norm.kind, 'origin');
  assert.equal(norm.originUrl, 'https://shopee.vn/product/12345/67890');
  assert.equal(norm.label, 'Ao khoac');

  const legacyUniversal =
    'https://shopee.vn/universal-link/product/555666/777888?deep_and_deferred=1&utm_source=an_888';
  assert.equal(normalizeShopeeOrigin(legacyUniversal).originUrl, 'https://shopee.vn/product/555666/777888');

  const universalRedir =
    'https://shopee.vn/universal-link?redir=https%3A%2F%2Fshopee.vn%2FGiay-i.42.99%3Fsp_atk%3Dxyz';
  assert.equal(normalizeShopeeOrigin(universalRedir).originUrl, 'https://shopee.vn/product/42/99');
});

test('preserves balanced parentheses inside Shopee product slugs while trimming sentence punctuation', () => {
  const insideSentence = '(https://shopee.vn/product/12/34),';
  assert.equal(insideSentence.slice(1), 'https://shopee.vn/product/12/34),');
  assert.deepEqual(splitTrailingPunctuation('https://shopee.vn/product/12/34),'), {
    urlPart: 'https://shopee.vn/product/12/34',
    trailing: '),',
  });

  assert.deepEqual(splitTrailingPunctuation('https://shopee.vn/Ao-(Form-Rong)-i.12.34.'), {
    urlPart: 'https://shopee.vn/Ao-(Form-Rong)-i.12.34',
    trailing: '.',
  });
});

test('converts single bare link including protocol-less input in single mode', async () => {
  const res = await convertInput('  shopee.vn/product/100/200?utm_source=old  ');
  assert.equal(res.mode, 'single');
  assert.equal(res.isSingleBareLink, true);
  assert.equal(res.isSingleItem, true);
  assert.equal(res.convertedCount, 1);
  assert.equal(res.errorCount, 0);
  assert.equal(
    res.outputText,
    `https://s.shopee.vn/an_redir?origin_link=${encodeURIComponent('https://shopee.vn/product/100/200')}${EXPECTED_SUFFIX}`,
  );
});

test('treats Shopee mobile share text with 1 link as single-item mode and extracts product title from prose', async () => {
  const shareMsg =
    'Hãy mua ngay sản phẩm Bàn phím cơ không dây Aula F75 với giá ưu đãi chỉ ₫699.000 trên Shopee! https://vn.shp.ee/abc123';
  assert.equal(
    extractTitleFromShareProse(
      'Hãy mua ngay sản phẩm Bàn phím cơ không dây Aula F75 với giá ưu đãi chỉ ₫699.000 trên Shopee! ',
    ),
    'Bàn phím cơ không dây Aula F75',
  );

  const res = await convertInput(shareMsg, {
    resolveShortUrl: async () => 'https://shopee.vn/product/111/222',
  });

  assert.equal(res.mode, 'single');
  assert.equal(res.isSingleItem, true);
  assert.equal(res.isSingleBareLink, false);
  assert.equal(res.convertedCount, 1);
  assert.equal(res.items[0].label, 'Bàn phím cơ không dây Aula F75');
});

test('replaces multiple Shopee links inline in prose while leaving non-Shopee URLs untouched', async () => {
  const raw = [
    'Săn sale tối nay nè mọi người ơi!',
    '1. Áo thun (https://shopee.vn/Ao-(Moi)-i.10.20?sp_atk=abc), giá cực êm.',
    '2. Tai nghe bluetooth: vn.shp.ee/xyz987!',
    'Xem review tại https://youtu.be/dQw4w9WgXcQ hoặc https://lazada.vn/products/test nhé.',
  ].join('\n');

  const res = await convertInput(raw, {
    resolveShortUrl: async (shortUrl) => {
      assert.equal(shortUrl, 'https://vn.shp.ee/xyz987');
      return 'https://shopee.vn/Tai-nghe-i.30.40?uls_trackid=123';
    },
  });

  assert.equal(res.mode, 'multi');
  assert.equal(res.isSingleBareLink, false);
  assert.equal(res.isSingleItem, false);
  assert.equal(res.convertedCount, 2);
  assert.equal(res.errorCount, 0);

  const link1 = buildAffiliateUrl('https://shopee.vn/product/10/20');
  const link2 = buildAffiliateUrl('https://shopee.vn/product/30/40');

  assert.ok(res.outputText.includes(`1. Áo thun (${link1}), giá cực êm.`));
  assert.ok(res.outputText.includes(`2. Tai nghe bluetooth: ${link2}!`));
  assert.ok(res.outputText.includes('https://youtu.be/dQw4w9WgXcQ'));
  assert.ok(res.outputText.includes('https://lazada.vn/products/test'));
});

test('never wraps unresolved short links into broken affiliate links and reports clear error', async () => {
  const res = await convertInput('Mua tại https://s.shopee.vn/deadlink ngay!', {
    resolveShortUrl: async () => {
      throw new Error('Không giải mã được link rút gọn');
    },
  });

  assert.equal(res.mode, 'single');
  assert.equal(res.isSingleItem, true);
  assert.equal(res.convertedCount, 0);
  assert.equal(res.errorCount, 1);
  assert.equal(res.outputText, 'Mua tại https://s.shopee.vn/deadlink ngay!');
  assert.equal(res.items[0].status, 'error');
  assert.equal(res.items[0].isUnresolvedShort, true);
  assert.match(res.items[0].errorMessage, /Không giải mã được/);
});

test('defaultResolveShortUrl falls back across resolvers, caches resolved origin, and preserves slug title', async () => {
  clearShortUrlCache();
  const requested = [];
  const fakeFetch = async (url) => {
    requested.push(url);
    if (url.startsWith('https://unshorten.me/')) {
      return { ok: false, text: async () => '' };
    }
    if (url.startsWith('https://api.allorigins.win/')) {
      return {
        ok: true,
        text: async () =>
          JSON.stringify({
            status: { url: 'https://shopee.vn/Ban-phim-co-i.777.888?utm_source=an_555' },
            contents: '',
          }),
      };
    }
    throw new Error('unexpected third call');
  };

  const first = await defaultResolveShortUrl('https://vn.shp.ee/cached1', { fetchImpl: fakeFetch });
  const second = await defaultResolveShortUrl('https://vn.shp.ee/cached1', { fetchImpl: fakeFetch });

  assert.equal(first, 'https://shopee.vn/product/777/888');
  assert.equal(second, 'https://shopee.vn/product/777/888');
  assert.equal(requested.length, 2);

  const converted = await convertInput('https://vn.shp.ee/cached1', {
    resolveShortUrl: (u) => defaultResolveShortUrl(u, { fetchImpl: fakeFetch }),
  });
  assert.equal(converted.items[0].label, 'Ban phim co');
});

test('rejects Shopee portal/admin links cleanly', async () => {
  const res = await convertInput('https://affiliate.shopee.vn/offer/custom_link');
  assert.equal(res.convertedCount, 0);
  assert.equal(res.errorCount, 1);
  assert.match(res.items[0].errorMessage, /quản trị/);
});

test('is idempotent when re-converting an already-converted output and handles Markdown links', async () => {
  const md = 'Xem [Áo khoác](https://shopee.vn/product/555/666?sp_atk=999) chính hãng';
  const once = await convertInput(md);
  const twice = await convertInput(once.outputText);

  const expectedUrl = buildAffiliateUrl('https://shopee.vn/product/555/666');
  assert.equal(once.items[0].label, 'Áo khoác');
  assert.equal(once.outputText, `Xem [Áo khoác](${expectedUrl}) chính hãng`);
  assert.equal(twice.outputText, once.outputText);
});
