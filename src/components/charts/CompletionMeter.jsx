// src/components/charts/CompletionMeter.jsx
import React from 'react';
import { SEQUENTIAL_TEAL } from '../../constants/chartPalette.js';
import './CompletionMeter.css';

const SIZE = 180;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** percent: 0~100, completed/total: 원본 건수(라벨용) */
function CompletionMeter({ percent, completed, total }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const dashOffset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="completion-meter">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="completion-meter-ring" role="img"
           aria-label={`작업 완료율 ${clamped}%`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none"
                stroke={SEQUENTIAL_TEAL.light} strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none"
          stroke={SEQUENTIAL_TEAL.dark} strokeWidth={STROKE} strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          className="completion-meter-arc"
        />
        <text x={SIZE / 2} y={SIZE / 2 + 10} textAnchor="middle" fontSize="34" fontWeight="800" fill="#1c1c1a">
          {clamped}%
        </text>
      </svg>
      <div className="completion-meter-caption">완료 {completed}건 / 전체 {total}건</div>
    </div>
  );
}

export default CompletionMeter;
