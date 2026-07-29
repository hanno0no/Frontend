/** 디자인/개발용 샘플 데이터. scripts/seed.sql 과 동일한 패턴. */

export const mockDashboard = {
  // IndexService: teamNum + "_" + orderId (파일명 접미사 M/A 없음)
  // M36_8 은 seed 에서 hidden_from_dashboard=1 → 완료 명단 제외
  completedTeam: ['H09_4'],
  waitingTeam: ['H38_2', 'M17_3', 'H07_7'],
  // endTime은 handler에서 현재 시각 기준으로 재계산
  emergencyMessage: ['아크릴 소진되었습니다.'],
  messages: [
    '허용 규격: MDF 3mm, 아크릴 3mm',
    '완료 명단에 팀명 확인 시, 가지러 오시기 바랍니다.',
  ],
};

export const mockOrders = [
  {
    orderId: 1,
    teamNum: 'M30',
    material: 'mdf_3mm',
    fileName: 'M30_1M',
    admin: '',
    state: 'submitted',
  },
  {
    orderId: 2,
    teamNum: 'H38',
    material: '아크릴_3mm',
    fileName: 'H38_2A',
    admin: '한수민',
    state: 'accepted',
  },
  {
    orderId: 3,
    teamNum: 'M17',
    material: '3d 프린팅',
    fileName: 'M17_3',
    admin: '한수민',
    state: 'design_complete',
  },
  {
    orderId: 4,
    teamNum: 'H09',
    material: 'mdf_3mm',
    fileName: 'H09_4M',
    admin: '한수민',
    state: 'print_complete',
  },
  {
    orderId: 5,
    teamNum: 'M07',
    material: 'mdf_3mm',
    fileName: 'M07_5M',
    admin: '',
    state: 'failed',
  },
  {
    orderId: 6,
    teamNum: 'M31',
    material: 'mdf_3mm',
    fileName: 'M31_6M',
    admin: '한수민',
    state: 'picked_up',
  },
  {
    orderId: 7,
    teamNum: 'H07',
    material: '아크릴_3mm',
    fileName: 'H07_7A',
    admin: '한수민',
    state: 'accepted',
  },
  {
    orderId: 8,
    teamNum: 'M36',
    material: 'mdf_3mm',
    fileName: 'M36_8M',
    admin: '한수민',
    state: 'print_complete',
  },
];

export const mockStatusList = [
  'submitted',
  'accepted',
  'design_complete',
  'print_complete',
  'picked_up',
  'failed',
];

export const mockAdminList = ['한수민'];

export const mockMaterials = ['mdf_3mm', '아크릴_3mm', '3d 프린팅'];

export const mockTeamStatus = [
  {
    orderId: 1,
    material: 'mdf_3mm',
    status: 'submitted',
    orderTime: '2025-10-18T11:21:01',
  },
  {
    orderId: 4,
    material: 'mdf_3mm',
    status: 'print_complete',
    orderTime: '2025-10-19T03:47:20',
  },
  {
    orderId: 6,
    material: 'mdf_3mm',
    status: 'picked_up',
    orderTime: '2025-10-18T13:22:06',
  },
];

export const mockSettings = {
  eventInfos: [
    {
      eventId: 1,
      eventName: '경상북도교육청 주관 제 7회 SW-AI 창의융합 해커톤',
      description: '레이저컷팅 / 3D 프린팅 접수·출력 운영',
      startTime: '2025-10-18T09:00:00',
      endTime: '2025-10-19T09:00:00',
      open: true,
    },
  ],
  messages: [
    {
      messageId: 1,
      content: '아크릴 소진되었습니다.',
      emergency: true,
      display: true,
    },
    {
      messageId: 2,
      content: '허용 규격: MDF 3mm, 아크릴 3mm',
      emergency: false,
      display: true,
    },
    {
      messageId: 3,
      content: '완료 명단에 팀명 확인 시, 가지러 오시기 바랍니다.',
      emergency: false,
      display: true,
    },
  ],
  materials: [
    { materialId: 1, materialName: 'mdf_3mm', active: true },
    { materialId: 3, materialName: '아크릴_3mm', active: true },
    { materialId: 7, materialName: '3d 프린팅', active: true },
  ],
  completedLimit: 9,
  waitingLimit: 12,
};
