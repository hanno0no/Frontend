import assert from 'node:assert/strict';
import { buildAdminViewParams } from './adminViewParams.js';

assert.deepEqual(
  buildAdminViewParams({
    status: 'all',
    manager: 'all',
    material: 'all',
    teamNum: 'all',
  }),
  {},
  'all 필터는 쿼리를 보내지 않는다'
);

assert.deepEqual(
  buildAdminViewParams({
    status: 'accepted',
    manager: 'all',
    material: 'all',
    teamNum: 'all',
  }),
  { status: 'accepted' }
);

assert.deepEqual(
  buildAdminViewParams({
    status: 'accepted',
    manager: 'unassigned',
    material: 'PLA',
    teamNum: 'T2_1',
  }),
  {
    status: 'accepted',
    manager: 'unassigned',
    material: 'PLA',
    teamNum: 'T2_1',
  },
  '담당자 없음은 unassigned 쿼리로 보낸다'
);

assert.deepEqual(
  buildAdminViewParams({
    status: 'accepted',
    manager: '미지정',
    material: 'PLA',
    teamNum: 'T2_1',
  }),
  {
    status: 'accepted',
    manager: '미지정',
    material: 'PLA',
    teamNum: 'T2_1',
  },
  '이름 미지정은 담당자 username으로 보낸다'
);

console.log('adminViewParams.check.js ok');
