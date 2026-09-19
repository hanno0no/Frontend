/** GET /admin/view 쿼리. 'all'/빈 값은 키를 생략한다. */
export const UNASSIGNED_MANAGER = 'unassigned';
export const UNASSIGNED_MANAGER_LABEL = '(없음)';

export function buildAdminViewParams({ status, manager, material, teamNum }) {
  const params = {};

  // status는 복수 선택 가능: 배열로 오면 그대로, 단일 값이면 배열로 감싸서 전송.
  // axios가 배열 값을 status=a&status=b 형태로 반복 전송하며, 이는 Spring의 List<String> 바인딩과 호환된다.
  const statusList = Array.isArray(status)
    ? status.filter((s) => s && s !== 'all')
    : (status && status !== 'all' ? [status] : []);
  if (statusList.length > 0) params.status = statusList;

  if (manager && manager !== 'all') params.manager = manager;
  if (material && material !== 'all') params.material = material;
  if (teamNum && teamNum !== 'all') params.teamNum = teamNum;
  return params;
}
