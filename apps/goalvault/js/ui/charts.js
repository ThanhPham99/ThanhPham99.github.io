// Thin Chart.js wrapper for value / progress lines that follows the current theme.
import { formatNumber } from '../domain.js';
import { getLang } from '../i18n.js';

export function lineChart(canvas, points, { color, target = null, percent = false }) {
  const dark = document.documentElement.classList.contains('dark');
  const grid = dark ? 'rgba(148,163,184,0.15)' : 'rgba(100,116,139,0.15)';
  const tick = dark ? '#94a3b8' : '#64748b';
  const lang = getLang();
  const fmt = (v) => (percent ? `${Math.round(v * 100)}%` : formatNumber(v, lang));
  const datasets = [{
    data: points.map((p) => p.value), borderColor: color, backgroundColor: `${color}22`,
    fill: true, tension: 0.3, pointRadius: points.length > 30 ? 0 : 3, pointBackgroundColor: color,
  }];
  if (target != null) {
    datasets.push({ data: points.map(() => target), borderColor: tick, borderDash: [4, 4], borderWidth: 1, pointRadius: 0, fill: false });
  }
  return new window.Chart(canvas, {
    type: 'line',
    data: { labels: points.map((p) => p.label), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => fmt(c.parsed.y) } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tick, maxTicksLimit: 6 } },
        y: { beginAtZero: true, suggestedMax: percent ? 1 : undefined, grid: { color: grid }, ticks: { color: tick, callback: fmt } },
      },
    },
  });
}
