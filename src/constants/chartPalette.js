/**
 * 차트용 색상 팔레트.
 * HNN 브랜드 색(--color-green #26a699)을 기준으로 확장한 팀 전용 팔레트.
 * 큰 값=브랜드 teal(완료/좋음), 작은 값=따뜻한 코랄(대기/주의)로 자연스럽게 이어지도록
 * HSL 보간을 사용한다 (RGB 직선 보간보다 중간톤이 탁해지지 않는다).
 */

export const BRAND_TEAL = '#26a699';
export const BRAND_CORAL = '#e8815c';
export const DANGER_RED = '#d1495b';

/** 카테고리 색상(고정 순서, 진한 톤) — 선 그래프처럼 흰 배경 위 얇은 선/도트에 사용 */
export const CATEGORICAL = [
  '#4f8ff7', // 1 blue
  BRAND_CORAL, // 2 coral
  '#f2c14e', // 3 yellow
  '#8b7bd8', // 4 violet
  '#e87ba4', // 5 magenta
  BRAND_TEAL, // 6 teal (브랜드)
];

/** CATEGORICAL의 파스텔 버전 — 도넛처럼 색이 넓은 면적을 채울 때 사용 */
export const CATEGORICAL_PASTEL = CATEGORICAL.map((hex) => pastelize(hex));

/**
 * 선 그래프처럼 얇은 선/작은 점에 쓰는 파스텔 톤 — 면 채우기용 파스텔(0.6/0.8)보다
 * 살짝 진하게(0.6/0.68) 잡아서 흰 배경 위에서도 선이 흐릿해지지 않게 한다.
 */
export const BRAND_TEAL_PASTEL = pastelize(BRAND_TEAL, 0.6, 0.68);
export const BRAND_CORAL_PASTEL = pastelize(BRAND_CORAL, 0.6, 0.68);
export const DANGER_RED_PASTEL = pastelize(DANGER_RED, 0.6, 0.68);

/**
 * 낮음→높음(빨강→teal) 4단계 앵커. 원색 느낌을 줄이기 위해 채도를 낮추고
 * 밝기를 올린 파스텔 톤으로 정의한다. 사이 값은 HSL로 부드럽게 보간한다.
 */
const RANK_SCALE_STOPS = ['#f0b3ae', '#f3cba3', '#f0dfa8', '#a9d6ce'];

/** 시퀀셜(teal) 램프 — 미터/게이지 등 단일 계열 크기 표현 */
export const SEQUENTIAL_TEAL = { light: '#d6f0ec', mid: '#4fc3b3', dark: BRAND_TEAL };

export const CHART_INK = {
  primary: '#1c1c1a',
  secondary: '#6b6a63',
  muted: '#9a988f',
  grid: '#ecebe4',
  axis: '#d8d6cb',
  surface: '#ffffff',
};

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]) {
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    default: h = (r - g) / d + 4;
  }
  return [h * 60, s, l];
}

function hueToRgb(p, q, t) {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}

function hslToRgb([h, s, l]) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue = h / 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hueToRgb(p, q, hue + 1 / 3) * 255,
    hueToRgb(p, q, hue) * 255,
    hueToRgb(p, q, hue - 1 / 3) * 255,
  ];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** 같은 색상각을 유지한 채 채도·밝기를 낮춰 파스텔 톤으로 바꾼다 */
function pastelize(hex, satTarget = 0.6, lightTarget = 0.8) {
  const [h] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb([h, satTarget, lightTarget]));
}

function mixHex(hexA, hexB, t) {
  const hslA = rgbToHsl(hexToRgb(hexA));
  const hslB = rgbToHsl(hexToRgb(hexB));
  // 색상각은 최단 경로로 보간
  let dh = hslB[0] - hslA[0];
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  const h = (hslA[0] + dh * t + 360) % 360;
  const s = lerp(hslA[1], hslB[1], t);
  const l = lerp(hslA[2], hslB[2], t);
  return rgbToHex(hslToRgb([h, s, l]));
}

/**
 * 0~1 사이 값(t)을 RANK_SCALE_STOPS 위에서 HSL 보간한다.
 * t=0 -> 빨강(낮음), t=1 -> teal(높음)
 */
export function statusScaleColor(t) {
  const clamped = Math.max(0, Math.min(1, t));
  const stops = RANK_SCALE_STOPS;
  const segment = clamped * (stops.length - 1);
  const index = Math.min(Math.floor(segment), stops.length - 2);
  const localT = segment - index;
  return mixHex(stops[index], stops[index + 1], localT);
}

/**
 * values 배열 내 각 값의 상대적 순위(최솟값=0, 최댓값=1)에 따라 색상을 반환한다.
 * 모든 값이 같으면 중간 톤을 반환한다.
 */
export function rankColors(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return values.map(() => statusScaleColor(0.6));
  }
  return values.map((v) => statusScaleColor((v - min) / (max - min)));
}
