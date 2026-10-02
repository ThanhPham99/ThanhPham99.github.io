import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MASK, displayNumber, isHidden, onPrivacyChange, setHidden } from '../js/privacy.js';

test('numbers are shown by default', () => {
  assert.equal(isHidden(), false);
  assert.equal(displayNumber(1234567.5, 'vi'), '1.234.567,5');
});

test('hidden mode masks every amount with a fixed-length mask', () => {
  const seen = [];
  const off = onPrivacyChange((v) => seen.push(v));
  setHidden(true);
  assert.equal(displayNumber(5, 'vi'), MASK);
  assert.equal(displayNumber(1e12, 'en'), MASK);
  assert.match(MASK, /^\*+$/);
  setHidden(true);
  setHidden(false);
  off();
  assert.equal(displayNumber(5, 'vi'), '5');
  assert.deepEqual(seen, [true, false]);
});

test('signed amounts keep the sign only when shown', () => {
  assert.equal(displayNumber(500, 'vi', { signed: true }), '+500');
  assert.equal(displayNumber(-500, 'vi', { signed: true }), '-500');
  setHidden(true);
  assert.equal(displayNumber(-500, 'vi', { signed: true }), MASK);
  setHidden(false);
});
