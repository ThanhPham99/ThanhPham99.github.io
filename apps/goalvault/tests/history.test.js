import { test } from 'node:test';
import assert from 'node:assert/strict';
import { averageSeries, valueSeries } from '../js/history.js';

const at = (y, m, d) => new Date(y, m - 1, d).getTime();

test('valueSeries accumulates in date order, one point per date', () => {
  const series = valueSeries([
    { date: '2026-01-05', amount: 10, createdAt: 2 },
    { date: '2026-01-03', amount: 5, createdAt: 1 },
    { date: '2026-01-05', amount: -3, createdAt: 3 },
  ]);
  assert.deepEqual(series, [{ date: '2026-01-03', value: 5 }, { date: '2026-01-05', value: 12 }]);
});

test('averageSeries averages capped progress of items that exist at each date', () => {
  const rows = [
    { item: { target: 100, createdAt: at(2026, 1, 1) }, entries: [{ date: '2026-01-10', amount: 50, createdAt: 1 }] },
    { item: { target: 10, createdAt: at(2026, 1, 5) }, entries: [{ date: '2026-01-05', amount: 20, createdAt: 2 }] },
  ];
  assert.deepEqual(averageSeries(rows, '2026-01-20'), [
    { date: '2026-01-01', avg: 0 },
    { date: '2026-01-05', avg: 0.5 },
    { date: '2026-01-10', avg: 0.75 },
    { date: '2026-01-20', avg: 0.75 },
  ]);
});

test('averageSeries starts at a backfilled entry and ignores future entries', () => {
  const rows = [{
    item: { target: 10, createdAt: at(2026, 2, 1) },
    entries: [{ date: '2026-01-15', amount: 5, createdAt: 1 }, { date: '2026-03-01', amount: 5, createdAt: 2 }],
  }];
  assert.deepEqual(averageSeries(rows, '2026-02-10'), [
    { date: '2026-01-15', avg: 0.5 }, { date: '2026-02-10', avg: 0.5 },
  ]);
});

test('averageSeries of nothing is empty', () => {
  assert.deepEqual(averageSeries([], '2026-02-10'), []);
});
