import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DICT, getLang, onLangChange, setLang, t } from '../js/i18n.js';

test('vi and en dictionaries have identical keys', () => {
  assert.deepEqual(Object.keys(DICT.en).sort(), Object.keys(DICT.vi).sort());
});

test('defaults to Vietnamese and interpolates params', () => {
  assert.equal(getLang(), 'vi');
  assert.equal(t('category.count', { n: 3 }), '3 mục tiêu');
});

test('setLang switches, notifies once, ignores unknown languages', () => {
  const seen = [];
  const off = onLangChange((lang) => seen.push(lang));
  setLang('en');
  assert.equal(t('category.count', { n: 2 }), '2 goals');
  setLang('fr');
  assert.equal(getLang(), 'en');
  off();
  setLang('vi');
  assert.deepEqual(seen, ['en']);
});

test('unknown keys fall back to the key itself', () => {
  assert.equal(t('nope.key'), 'nope.key');
});
