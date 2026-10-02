// Thin Chart.js wrapper for value / progress lines that follows the current theme.
import { formatPct } from '../domain.js';
import { displayNumber } from '../privacy.js';
import { getLang } from '../i18n.js';

export function lineChart(canvas, points, { color, target = null, percent = false }) {
  const dark = document.documentElement.classList.contains('dark');
  const grid = dark ? 'rgba(148,163,184,0.12)' : 'rgba(100,116,139,0.12)';
  const tick = dark ? '#94a3b8' : '#64748b';
  const lang = getLang();
  const fmt = (v) => (percent ? formatPct(v) : displayNumber(v, lang));
  const fill = (ctx) => {
    const { chartArea, ctx: c } = ctx.chart;
    if (!chartArea) return `${color}22`;
    const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    g.addColorStop(0, `${color}55`);
    g.addColorStop(1, `${color}00`);
    return g;
  };
  const datasets = [{
    data: points.map((p) => p.value), borderColor: color, backgroundColor: fill, borderWidth: 2.5,
    fill: true, tension: 0.35, pointRadius: points.length > 12 ? 0 : 3, pointHoverRadius: 5,
    pointBackgroundColor: color, pointBorderColor: dark ? '#0f172a' : '#ffffff', pointBorderWidth: 2,
  }];
  if (target != null) {
    datasets.push({ data: points.map(() => target), borderColor: tick, borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 0, fill: false });
  }
  return new window.Chart(canvas, {
    type: 'line',
    data: { labels: points.map((p) => p.label), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 500 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: (item) => item.datasetIndex === 0,
          displayColors: false,
          padding: 10,
          cornerRadius: 10,
          callbacks: { title: (items) => points[items[0].dataIndex]?.title ?? items[0].label, label: (c) => fmt(c.parsed.y) },
        },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: tick, maxTicksLimit: 5, maxRotation: 0, autoSkipPadding: 12 } },
        y: {
          beginAtZero: true, suggestedMax: percent ? 1 : undefined, max: percent ? 1 : undefined,
          grid: { color: grid }, border: { display: false }, ticks: { color: tick, maxTicksLimit: 5, callback: fmt },
        },
      },
    },
  });
}
