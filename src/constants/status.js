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
 * 상태 코드 → 진행 단계.
 * 팀별 조회 페이지와 어드민 페이지가 서로 다른 기준으로 상태를 강조하기 위한 공통 분류.
 * - in_progress: 제출/접수/디자인 완료 (아직 다음 단계로 넘어가야 함)
 * - ready: 출력 완료 (학생 픽업 가능 — 팀 입장에서의 "완료")
 * - done: 수령 완료 (완전 종료 — 어드민 입장에서의 "완료")
 * - failed: 실패
 */
export const STATUS_STAGE = {
  submitted: 'in_progress',
  accepted: 'in_progress',
  design_complete: 'in_progress',
  print_complete: 'ready',
  picked_up: 'done',
  failed: 'failed',
};

/** 팀별 조회 페이지: "출력 완료(픽업 가능)"만 강조, 나머지는 무난한 톤 */
export function getTeamStatusStyle(code) {
  switch (STATUS_STAGE[code]) {
    case 'ready':
      return 'status-badge status-badge--ready';
    case 'failed':
      return 'status-badge status-badge--muted';
    default:
      return 'status-badge status-badge--neutral';
  }
}

/** 어드민 페이지: "처리 필요(진행중)" 상태만 강조, 실패는 눈에 덜 띄게 */
export function getAdminStatusStyle(code) {
  switch (STATUS_STAGE[code]) {
    case 'in_progress':
      return 'status-badge status-badge--action-needed';
    case 'ready':
      return 'status-badge status-badge--ready';
    case 'failed':
      return 'status-badge status-badge--muted';
    default:
      return 'status-badge status-badge--neutral';
  }
}

/** 실패를 제외한 정상 진행 순서. "다음 상태로" 버튼에서 사용. */
export const STATUS_PROGRESSION = STATUS_ORDER.filter((code) => code !== 'failed');

/** 다음 상태 코드를 반환. 마지막 단계(수령 완료)나 실패 상태면 null. */
export function getNextStatus(code) {
  const index = STATUS_PROGRESSION.indexOf(code);
  if (index === -1 || index === STATUS_PROGRESSION.length - 1) return null;
  return STATUS_PROGRESSION[index + 1];
}

/** 이전 상태 코드를 반환. 첫 단계(제출 완료)나 실패 상태면 null. */
export function getPreviousStatus(code) {
  const index = STATUS_PROGRESSION.indexOf(code);
  if (index <= 0) return null;
  return STATUS_PROGRESSION[index - 1];
}

/**
 * 필터용 상태 코드 목록.
 * STATUS_ORDER 순서를 유지하고, 선택된 값이 목록에 없으면 끝에 추가.
 * selected는 단일 값('all' 포함) 또는 배열(복수 선택)을 모두 받는다.
 */
export function buildStatusOptions(codes, selected = 'all') {
  const selectedList = Array.isArray(selected) ? selected : [selected];
  const set = new Set(codes.filter(Boolean));
  selectedList.forEach((value) => {
    if (value && value !== 'all') set.add(value);
  });

  const ordered = STATUS_ORDER.filter((code) => set.has(code));
  const extras = [...set].filter((code) => !STATUS_ORDER.includes(code));
  return [...ordered, ...extras];
}
