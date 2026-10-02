import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDelta, averageProgress, formatDate, formatShortDate, maskDateInput, parseDisplayDate, formatInput, formatNumber, formatPct, groupCategoryItems, itemStatus,
  activeCategories, activeItems, normalizeTag, overviewKpis, parseNumber, progress, tagsOf, todayStr, validateItemInput,
} from '../js/domain.js';

const at = (y, m, d) => new Date(y, m - 1, d).getTime();
const item = (over = {}) => ({
  id: 'i1', categoryId: 'c1', name: 'X', target: 100, current: 0, tag: null, deadline: null,
  note: '', archived: false, createdAt: at(2026, 1, 1), updatedAt: at(2026, 1, 1), ...over,
});
const TODAY = '2026-07-02';

test('parseNumber accepts both separator styles', () => {
  const cases = [
    ['1000000', 1e6], ['1.000.000', 1e6], ['1,000,000', 1e6], ['1.5', 1.5], ['1,5', 1.5],
    ['0,125', 0.125], ['1.000,5', 1000.5], ['1,000.5', 1000.5], ['1000.125', 1000.125],
    ['1.000', 1000], [' 2 500 ', 2500], ['-500', -500],
  ];
  for (const [input, expected] of cases) assert.equal(parseNumber(input), expected, input);
});

test('parseNumber rejects garbage', () => {
  for (const input of ['', 'abc', '1.2.3', '1,2,3,', '--1', '1e5']) assert.ok(Number.isNaN(parseNumber(input)), input);
});

test('formatNumber follows the locale and round-trips through parseNumber', () => {
  assert.equal(formatNumber(1234567.5, 'vi'), '1.234.567,5');
  assert.equal(formatNumber(1234567.5, 'en'), '1,234,567.5');
  for (const lang of ['vi', 'en']) {
    for (const n of [0.125, 0.5, 12, 1000, 1000.125, 1234567.5]) assert.equal(parseNumber(formatNumber(n, lang), lang), n, `${lang} ${n}`);
  }
});

test('a lone separator matching the UI language decimal mark is a decimal', () => {
  assert.equal(parseNumber('1,125', 'vi'), 1.125);
  assert.equal(parseNumber('1.125', 'en'), 1.125);
  assert.equal(parseNumber('1,125', 'en'), 1125);
  assert.equal(parseNumber('1.125', 'vi'), 1125);
  assert.equal(parseNumber('1,5', 'en'), 1.5);
  assert.equal(parseNumber('1,000,000', 'vi'), 1e6);
});

test('prefilled input values round-trip exactly, including 3 and 8+ decimals', () => {
  for (const lang of ['vi', 'en']) {
    for (const n of [1.125, 12.345, 999.999, 2.375, 0.00012345, 1.23456, 1234567.891]) {
      assert.equal(parseNumber(formatInput(n, lang), lang), n, `${lang} ${n}`);
    }
  }
});

test('progress tolerates float drift from summed decimals', () => {
  assert.equal(progress({ current: 0.7 + 0.1, target: 0.8 }), 1);
});

test('formatPct never shows 100% for an unfinished goal', () => {
  assert.equal(formatPct(0.996), '99%');
  assert.equal(formatPct(1), '100%');
  assert.equal(formatPct(1.257), '125%');
  assert.equal(formatPct(0.004), '0%');
  assert.equal(formatPct(null), '—');
});

test('dates use the local calendar day', () => {
  assert.equal(todayStr(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
  assert.equal(formatDate('2026-01-05', 'vi'), '05/01/2026');
  assert.equal(formatShortDate('2026-01-05', 'vi'), '05/01');
  assert.equal(formatShortDate('2026-01-05', 'en'), '05/01');
  assert.equal(formatDate('2026-01-05', 'en'), '05/01/2026');
});

test('averageProgress caps each item at 100% and returns null when empty', () => {
  assert.equal(averageProgress([item({ current: 50 }), item({ current: 300 })]), 0.75);
  assert.equal(averageProgress([]), null);
});

test('itemStatus without deadline', () => {
  const st = itemStatus(item({ current: 20 }), TODAY);
  assert.equal(st.key, 'noDeadline');
  assert.equal(st.perMonth, null);
  assert.equal(st.remaining, 80);
});

test('itemStatus: achieved wins even past the deadline', () => {
  const st = itemStatus(item({ current: 100, deadline: '2026-06-01' }), TODAY);
  assert.equal(st.key, 'achieved');
  assert.equal(st.overdue, false);
});

test('itemStatus: behind vs on track against linear expectation', () => {
  const base = { deadline: '2026-12-31' };
  const behind = itemStatus(item({ ...base, current: 30 }), TODAY);
  assert.equal(behind.expectedPct, 0.5);
  assert.equal(behind.key, 'behind');
  assert.ok(Math.abs(behind.perMonth - 70 / (182 / 30.4375)) < 1e-9);
  assert.equal(itemStatus(item({ ...base, current: 45 }), TODAY).key, 'onTrack');
});

test('itemStatus: due soon, due today, overdue', () => {
  const soon = itemStatus(item({ current: 95, deadline: '2026-07-20' }), TODAY);
  assert.equal(soon.key, 'dueSoon');
  assert.equal(soon.daysLeft, 18);
  const todayDue = itemStatus(item({ current: 95, deadline: TODAY }), TODAY);
  assert.equal(todayDue.daysLeft, 0);
  assert.equal(todayDue.overdue, false);
  const late = itemStatus(item({ current: 10, deadline: '2026-06-30' }), TODAY);
  assert.equal(late.key, 'overdue');
  assert.equal(late.daysLeft, -2);
  assert.equal(late.perMonth, null);
});

test('normalizeTag and tagsOf', () => {
  assert.equal(normalizeTag('  Du   lịch '), 'Du lịch');
  assert.equal(normalizeTag(''), null);
  assert.equal(normalizeTag(null), null);
  assert.deepEqual(tagsOf([item({ tag: 'b' }), item({ tag: ' a ' }), item({ tag: 'b' }), item()]), ['a', 'b']);
});

test('groupCategoryItems: tag groups alphabetically, untagged items stand alone', () => {
  const rows = groupCategoryItems([
    item({ id: 'a', tag: 'Du lịch', createdAt: 3, current: 100 }),
    item({ id: 'b', tag: ' Du  lịch ', createdAt: 1, current: 0 }),
    item({ id: 'c', createdAt: 2 }),
    item({ id: 'd', tag: 'An toàn', createdAt: 4 }),
    item({ id: 'e', tag: '', createdAt: 0 }),
  ]);
  assert.deepEqual(rows.map((r) => (r.type === 'group' ? `g:${r.tag}:${r.items.map((i) => i.id).join('')}` : `i:${r.item.id}`)),
    ['g:An toàn:d', 'g:Du lịch:ba', 'i:e', 'i:c']);
  assert.equal(rows[1].avg, 0.5);
});

test('validateItemInput', () => {
  assert.deepEqual(validateItemInput({ name: 'A', target: 10, current: 0, deadline: null }), {});
  assert.deepEqual(validateItemInput({ name: '  ', target: 0, current: -1, deadline: '2026-13' }),
    { name: 'required', target: 'positive', current: 'nonNegative', deadline: 'invalidDate' });
  assert.equal(validateItemInput({ name: 'A', target: NaN, current: 0 }).target, 'positive');
});

test('applyDelta rounds floats and refuses negatives / NaN', () => {
  assert.equal(applyDelta(0.1, 0.2), 0.3);
  assert.throws(() => applyDelta(10, -11), /NEGATIVE_CURRENT/);
  assert.throws(() => applyDelta(10, NaN), /INVALID_NUMBER/);
});

test('overviewKpis counts achieved and behind/overdue', () => {
  const k = overviewKpis([
    item({ current: 100 }),
    item({ current: 30, deadline: '2026-12-31' }),
    item({ current: 10, deadline: '2026-06-30' }),
    item({ current: 50 }),
  ], TODAY);
  assert.deepEqual({ total: k.total, achieved: k.achieved, behind: k.behind }, { total: 4, achieved: 1, behind: 2 });
  assert.equal(k.avg, (1 + 0.3 + 0.1 + 0.5) / 4);
});

test('only categories are archived: an archived category hides its goals; legacy goal flags are ignored', () => {
  const state = {
    categories: [{ id: 'c1', archived: false }, { id: 'c2', archived: true }, { id: 'c3' }],
    items: [
      item({ id: 'a', categoryId: 'c1' }),
      item({ id: 'b', categoryId: 'c1', archived: true }),
      item({ id: 'c', categoryId: 'c2' }),
      item({ id: 'd', categoryId: 'c3' }),
    ],
  };
  assert.deepEqual(activeCategories(state).map((c) => c.id), ['c1', 'c3']);
  assert.deepEqual(activeItems(state).map((i) => i.id), ['a', 'b', 'd']);
});

test('parseDisplayDate reads dd/mm/yyyy (and - or . separators) into ISO, rejecting impossible dates', () => {
  assert.equal(parseDisplayDate('23/03/2026'), '2026-03-23');
  assert.equal(parseDisplayDate('5/1/2026'), '2026-01-05');
  assert.equal(parseDisplayDate(' 05-01-2026 '), '2026-01-05');
  assert.equal(parseDisplayDate('05.01.2026'), '2026-01-05');
  for (const bad of ['', '31/02/2026', '2026-03-23', '23/13/2026', '23/03/26', 'abc', '00/01/2026']) {
    assert.equal(parseDisplayDate(bad), null, bad);
  }
});

test('maskDateInput inserts slashes while typing digits', () => {
  assert.equal(maskDateInput('2'), '2');
  assert.equal(maskDateInput('23'), '23');
  assert.equal(maskDateInput('230'), '23/0');
  assert.equal(maskDateInput('23032026'), '23/03/2026');
  assert.equal(maskDateInput('23/03/2026'), '23/03/2026');
  assert.equal(maskDateInput('230320261'), '23/03/2026');
  assert.equal(maskDateInput('ab23c'), '23');
});
