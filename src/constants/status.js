/** 기획서 §5.3 / API 명세 v0.5 — 주문 상태 단일 정의 */

export const STATUS_LABELS = {
  submitted: '제출 완료',
  accepted: '접수 완료',
  design_complete: '디자인 완료',
  print_complete: '출력 완료',
  picked_up: '수령 완료',
  failed: '실패',
};

export const STATUS_ORDER = [
  'submitted',
  'accepted',
  'design_complete',
  'print_complete',
  'picked_up',
  'failed',
];

/** 상태 코드 → 한글 표시명 */
export function getStatusLabel(code) {
  return STATUS_LABELS[code] || code;
}

/**
 * 필터/드롭다운용 옵션 목록.
 * STATUS_ORDER 순서를 유지하고, 선택된 값이 목록에 없으면 끝에 추가.
 */
export function buildStatusOptions(codes, selected = 'all') {
  const set = new Set(codes.filter(Boolean));
  if (selected && selected !== 'all') set.add(selected);

  const ordered = STATUS_ORDER.filter((code) => set.has(code));
  const extras = [...set].filter((code) => !STATUS_ORDER.includes(code));
  return ['all', ...ordered, ...extras];
}
