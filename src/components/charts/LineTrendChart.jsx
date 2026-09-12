// src/components/charts/LineTrendChart.jsx
import React, { useState } from 'react';
import { CHART_INK } from '../../constants/chartPalette.js';
import './LineTrendChart.css';

const WIDTH = 720;
const HEIGHT = 280;
const PADDING = { top: 20, right: 28, bottom: 36, left: 44 };

/** 1 / 2 / 5 / 10 ... 처럼 깔끔한 눈금 간격을 고른다 (중복 반올림 라벨 방지) */
function niceStep(roughStep) {
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const residual = roughStep / magnitude;
  let niceResidual;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  else niceResidual = 1;
  return niceResidual * magnitude;
}

function computeGrid(rawMax) {
  if (rawMax <= 0) return { step: 1, max: 4 };
  // 주문 건수는 항상 정수이므로 눈금 간격도 최소 1 이상으로 고정한다
  const step = Math.max(1, niceStep(rawMax / 4));
  const max = Math.ceil(rawMax / step) * step;
  return { step, max };
}

function formatLabel(isoString, granularity) {
  const d = new Date(isoString);
  if (granularity === 'day') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return `${String(d.getHours()).padStart(2, '0')}시`;
}

function buildPoints(data, code, plotWidth, plotHeight, maxValue) {
  const n = data.length;
  return data.map((d, i) => {
    const x = PADDING.left + (n <= 1 ? plotWidth / 2 : (i / (n - 1)) * plotWidth);
    const value = d[code] ?? 0;
    const y = PADDING.top + plotHeight - (value / maxValue) * plotHeight;
    return { x, y, value };
  });
}

/** Catmull-Rom -> cubic Bezier 변환으로 부드러운 곡선 경로를 만든다 */
function smoothLinePath(points) {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function areaPath(linePath, points, baselineY) {
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x.toFixed(1)},${baselineY} L ${first.x.toFixed(1)},${baselineY} Z`;
}

/** series: [{ code, label, color }] */
function LineTrendChart({ data, granularity, series }) {
  const [hiddenCodes, setHiddenCodes] = useState(() => new Set());

  if (!data || data.length === 0) {
    return <div className="line-trend-empty">표시할 데이터가 없습니다.</div>;
  }

  const toggleSeries = (code) => {
    setHiddenCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const visibleSeries = series.filter((s) => !hiddenCodes.has(s.code));

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
  const baselineY = PADDING.top + plotHeight;

  const maxRaw = visibleSeries.length === 0
    ? 0
    : Math.max(...data.flatMap((d) => visibleSeries.map((s) => d[s.code] ?? 0)));
  const { step: gridStep, max: maxValue } = computeGrid(maxRaw);
  const showArea = visibleSeries.length <= 2;

  const seriesPoints = visibleSeries.map((s) => ({
    ...s,
    points: buildPoints(data, s.code, plotWidth, plotHeight, maxValue),
  }));
  seriesPoints.forEach((s) => { s.linePath = smoothLinePath(s.points); });

  const gridLines = [];
  for (let value = 0; value <= maxValue + 1e-9; value += gridStep) {
    const y = PADDING.top + plotHeight - (value / maxValue) * plotHeight;
    gridLines.push({ y, value: Math.round(value) });
  }

  const labelEvery = Math.max(1, Math.ceil(data.length / 7));
  const xLabels = data
    .map((d, i) => ({ i, label: formatLabel(d.hour, granularity) }))
    .filter(({ i }) => i % labelEvery === 0 || i === data.length - 1);

  return (
    <div className="line-trend-chart">
      <div className="line-trend-filters">
        {series.map((s) => {
          const active = !hiddenCodes.has(s.code);
          return (
            <button
              key={s.code}
              type="button"
              className={`line-trend-filter-chip${active ? ' is-active' : ''}`}
              style={active ? { borderColor: s.color, color: s.color } : undefined}
              onClick={() => toggleSeries(s.code)}
            >
              <span className="legend-dot" style={{ backgroundColor: active ? s.color : '#d8d6cb' }} />
              {s.label}
            </button>
          );
        })}
      </div>

      {visibleSeries.length === 0 ? (
        <div className="line-trend-empty">표시할 상태를 선택해주세요.</div>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="line-trend-svg" role="img"
             aria-label="시간대별 상태별 추이 선 그래프">
          <defs>
            {seriesPoints.map((s) => (
              <linearGradient key={s.code} id={`area-${s.code}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          {gridLines.map(({ y, value }) => (
            <g key={value}>
              <line x1={PADDING.left} y1={y} x2={WIDTH - PADDING.right} y2={y}
                    stroke={CHART_INK.grid} strokeWidth="1" />
              <text x={PADDING.left - 10} y={y + 4} textAnchor="end" fontSize="11" fill={CHART_INK.muted}>
                {Math.round(value)}
              </text>
            </g>
          ))}

          <line x1={PADDING.left} y1={baselineY} x2={WIDTH - PADDING.right} y2={baselineY}
                stroke={CHART_INK.axis} strokeWidth="1" />

          {xLabels.map(({ i, label }) => {
            const x = PADDING.left + (data.length <= 1 ? plotWidth / 2 : (i / (data.length - 1)) * plotWidth);
            return (
              <text key={i} x={x} y={HEIGHT - 12} textAnchor="middle" fontSize="11" fill={CHART_INK.muted}>
                {label}
              </text>
            );
          })}

          {showArea && seriesPoints.map((s) => (
            <path key={`area-${s.code}`} d={areaPath(s.linePath, s.points, baselineY)} fill={`url(#area-${s.code})`} />
          ))}

          {seriesPoints.map((s) => (
            <path key={`line-${s.code}`} d={s.linePath} fill="none" stroke={s.color}
                  strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          ))}

          {seriesPoints.map((s) => (
            <g key={`dots-${s.code}`}>
              {s.points.map((p, i) => p.value > 0 && (
                <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={s.color} stroke={CHART_INK.surface} strokeWidth="1.5">
                  <title>{`${formatLabel(data[i].hour, granularity)} ${s.label} ${p.value}건`}</title>
                </circle>
              ))}
            </g>
          ))}

          {seriesPoints.map((s) => {
            const last = s.points[s.points.length - 1];
            return (
              <g key={`end-${s.code}`}>
                <circle cx={last.x} cy={last.y} r="4" fill={s.color} stroke={CHART_INK.surface} strokeWidth="2" />
                <text x={last.x + 8} y={last.y + 4} fontSize="12" fontWeight="700" fill={CHART_INK.primary}>
                  {last.value}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

export default LineTrendChart;
