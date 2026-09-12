// src/components/charts/StatePieChart.jsx
import React from 'react';
import { CATEGORICAL_PASTEL, CHART_INK } from '../../constants/chartPalette.js';
import './StatePieChart.css';

const SIZE = 320;
const CENTER = SIZE / 2;
const OUTER_RADIUS = 95;
const INNER_RADIUS = 58;
const LABEL_RADIUS = OUTER_RADIUS + 22;

function polarPoint(radius, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(angleRad),
    y: CENTER + radius * Math.sin(angleRad),
  };
}

function donutSlicePath(startAngle, endAngle) {
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  const outerStart = polarPoint(OUTER_RADIUS, startAngle);
  const outerEnd = polarPoint(OUTER_RADIUS, endAngle);
  const innerEnd = polarPoint(INNER_RADIUS, endAngle);
  const innerStart = polarPoint(INNER_RADIUS, startAngle);

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArcFlag} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function labelPosition(midAngleDeg) {
  const { x, y } = polarPoint(LABEL_RADIUS, midAngleDeg);
  const angleRad = ((midAngleDeg - 90) * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const anchor = cos > 0.15 ? 'start' : cos < -0.15 ? 'end' : 'middle';
  return { x, y, anchor };
}

/** data: [{ code, label, value }] */
function StatePieChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <div className="state-pie-empty">표시할 데이터가 없습니다.</div>;
  }

  let cursor = 0;
  const slices = data
    .filter((d) => d.value > 0)
    .map((d, i) => {
      const startAngle = cursor;
      const sweep = (d.value / total) * 360;
      const endAngle = cursor + sweep;
      cursor = endAngle;
      const midAngle = (startAngle + endAngle) / 2;
      const percent = Math.round((d.value / total) * 100);
      return {
        ...d,
        color: CATEGORICAL_PASTEL[i % CATEGORICAL_PASTEL.length],
        path: donutSlicePath(startAngle, endAngle),
        labelPos: labelPosition(midAngle),
        percent,
      };
    });

  return (
    <div className="state-pie-chart">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="state-pie-svg" role="img" aria-label="상태별 주문 비중 도넛 그래프">
        <defs>
          <filter id="donutShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000000" floodOpacity="0.12" />
          </filter>
        </defs>
        <g filter="url(#donutShadow)">
          {slices.map((s) => (
            <path key={s.code} d={s.path} fill={s.color} stroke={CHART_INK.surface} strokeWidth="2.5"
                  className="state-pie-slice">
              <title>{`${s.label} ${s.value}건 (${s.percent}%)`}</title>
            </path>
          ))}
        </g>
        {slices.map((s) => (
          <text key={`${s.code}-label`} x={s.labelPos.x} y={s.labelPos.y} textAnchor={s.labelPos.anchor}
                fontSize="13" fontWeight="700" fill={CHART_INK.secondary}>
            {`${s.percent}%`}
          </text>
        ))}
        <text x={CENTER} y={CENTER + 10} textAnchor="middle" fontSize="32" fontWeight="800" fill={CHART_INK.primary}>
          {total}
        </text>
      </svg>
      <ul className="state-pie-legend">
        {slices.map((s) => (
          <li key={s.code}>
            <span className="legend-dot" style={{ backgroundColor: s.color }} />
            <span className="state-pie-legend-label">{s.label}</span>
            <span className="state-pie-legend-value">{s.value}건 · {s.percent}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StatePieChart;
