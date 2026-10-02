// Reconstructs value/progress over time from entries (pure).
import { averageProgress, msToDateStr, roundNum } from './domain.js';

const sortEntries = (entries) =>
  [...entries].sort((a, b) => a.date.localeCompare(b.date) || (a.createdAt ?? 0) - (b.createdAt ?? 0));

export function valueSeries(entries) {
  const out = [];
  let value = 0;
  for (const e of sortEntries(entries)) {
    value = roundNum(value + e.amount);
    const last = out[out.length - 1];
    if (last && last.date === e.date) last.value = value;
    else out.push({ date: e.date, value });
  }
  return out;
}

function valueAt(series, date) {
  let value = 0;
  for (const point of series) {
    if (point.date > date) break;
    value = point.value;
  }
  return value;
}

// An item joins the average from its creation day, or from its earliest (backfilled) entry if older.
export function averageSeries(rows, today) {
  const prepared = rows.map(({ item, entries }) => {
    const series = valueSeries(entries);
    const created = msToDateStr(item.createdAt);
    const start = series.length && series[0].date < created ? series[0].date : created;
    return { target: item.target, series, start };
  });
  if (!prepared.length) return [];
  const dates = [...new Set(prepared.flatMap((p) => [p.start, ...p.series.map((s) => s.date)]).concat(today))]
    .filter((d) => d <= today)
    .sort();
  const out = [];
  for (const date of dates) {
    const active = prepared.filter((p) => p.start <= date);
    if (!active.length) continue;
    out.push({ date, avg: averageProgress(active.map((p) => ({ target: p.target, current: valueAt(p.series, date) }))) });
  }
  return out;
}
