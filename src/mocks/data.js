/** 디자인/개발용 샘플 데이터. 백엔드 없이도 화면을 채웁니다. */

export const mockDashboard = {
  completedTeam: ['T1_1', 'T1_3', 'T2_2', 'T3_1', 'T4_5'],
  waitingTeam: ['T2_1', 'T3_4', 'T5_2', 'T6_1'],
  // endTime은 handler에서 현재 시각 기준으로 재계산
  emergencyMessage: ['긴급: 출력기 점검 중입니다', '접수대 앞 대기열을 유지해 주세요'],
  messages: [
    '3D 프린터 출력 예상 대기 시간: 약 40분',
    '파일명은 팀명_재질 형식으로 제출해 주세요',
    '접수 후 접수대로 이동해 주문을 완료해 주세요',
    '디자인 검수 완료된 팀부터 순차 출력됩니다',
  ],
};

export const mockOrders = [
  {
    orderId: 101,
    teamNum: 'T2_1',
    material: 'PLA',
    fileName: 'T2_1_PLA.stl',
    admin: '김한노',
    state: 'register',
  },
  {
    orderId: 102,
    teamNum: 'T3_4',
    material: 'ABS',
    fileName: 'T3_4_ABS.stl',
    admin: '',
    state: 'submission',
  },
  {
    orderId: 103,
    teamNum: 'T5_2',
    material: 'PETG',
    fileName: 'T5_2_PETG.stl',
    admin: '이한노',
    state: 'design',
  },
  {
    orderId: 104,
    teamNum: 'T1_1',
    material: 'PLA',
    fileName: 'T1_1_PLA.stl',
    admin: '김한노',
    state: 'print',
  },
  {
    orderId: 105,
    teamNum: 'T6_1',
    material: 'TPU',
    fileName: null,
    admin: '',
    state: 'rejection',
  },
];

export const mockStatusList = [
  'submission',
  'register',
  'design',
  'print',
  'rejection',
];

export const mockAdminList = ['김한노', '이한노', '박한노'];

export const mockMaterials = ['PLA', 'ABS', 'PETG', 'TPU'];

export const mockTeamStatus = [
  {
    orderId: 201,
    material: 'PLA',
    status: 'print',
    orderTime: '2026-07-21T14:30:00',
  },
  {
    orderId: 202,
    material: 'ABS',
    status: 'design',
    orderTime: '2026-07-21T15:10:00',
  },
  {
    orderId: 203,
    material: 'PETG',
    status: 'register',
    orderTime: '2026-07-21T16:05:00',
  },
];

export const mockSettings = {
  eventInfos: [
    {
      eventId: 1,
      eventName: '한노 여름방학 해커톤',
      description: '3D 프린팅 접수 및 출력 운영',
      startTime: '2026-07-21T09:00:00',
      endTime: '2026-07-21T21:00:00',
      open: true,
    },
    {
      eventId: 2,
      eventName: '예비 행사',
      description: '테스트용 비활성 대회',
      startTime: '2026-08-01T10:00:00',
      endTime: '2026-08-01T18:00:00',
      open: false,
    },
  ],
  messages: [
    {
      messageId: 1,
      content: '출력기 점검으로 대기가 길어질 수 있습니다',
      emergency: true,
      display: true,
    },
    {
      messageId: 2,
      content: '접수 후 접수대로 이동해 주세요',
      emergency: false,
      display: true,
    },
    {
      messageId: 3,
      content: '숨김 공지 (표시 안 함)',
      emergency: false,
      display: false,
    },
  ],
  materials: [
    { materialId: 1, materialName: 'PLA', active: true },
    { materialId: 2, materialName: 'ABS', active: true },
    { materialId: 3, materialName: 'PETG', active: true },
    { materialId: 4, materialName: 'TPU', active: false },
  ],
};
