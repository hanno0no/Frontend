/** GET /admin/view 쿼리. 'all'은 키를 생략한다. */
export const UNASSIGNED_MANAGER = 'unassigned';
export const UNASSIGNED_MANAGER_LABEL = '(없음)';

export function buildAdminViewParams({ status, manager, material, teamNum }) {
  const params = {};
  if (status && status !== 'all') params.status = status;
  if (manager && manager !== 'all') params.manager = manager;
  if (material && material !== 'all') params.material = material;
  if (teamNum && teamNum !== 'all') params.teamNum = teamNum;
  return params;
}
