import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routeHref } from '../js/route.js';

test('parseRoute', () => {
  assert.deepEqual(parseRoute(''), { name: 'overview' });
  assert.deepEqual(parseRoute('#/categories'), { name: 'categories' });
  assert.deepEqual(parseRoute('#/category/abc%20d'), { name: 'category', id: 'abc d' });
  assert.deepEqual(parseRoute('#/category'), { name: 'overview' });
  assert.deepEqual(parseRoute('#/archive'), { name: 'archive' });
  assert.deepEqual(parseRoute('#/whatever'), { name: 'overview' });
});

test('routeHref round-trips', () => {
  assert.equal(routeHref('categories'), '#/categories');
  assert.deepEqual(parseRoute(routeHref('category', 'a/b')), { name: 'category', id: 'a/b' });
});
