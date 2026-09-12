import {
  mockAdminList,
  mockDashboard,
  mockMaterials,
  mockOrders,
  mockSettings,
  mockStatusList,
  mockTeamStatus,
} from './data.js';

/** 런타임에 변경 가능한 in-memory store */
const store = {
  orders: structuredClone(mockOrders),
  settings: structuredClone(mockSettings),
  nextOrderId: 9,
  nextMessageId: 4,
  nextMaterialId: 8,
  nextEventId: 2,
};

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

function getBody(config) {
  if (!config.data) return {};
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data);
    } catch {
      return {};
    }
  }
  return config.data;
}

function resolvePath(config) {
  let url = config.url || '';
  if (config.baseURL && !/^https?:\/\//i.test(url)) {
    url = `${String(config.baseURL).replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
  }
  const parsed = new URL(url, 'http://mock.local');
  const extra = config.params;
  if (extra) {
    const entries = extra instanceof URLSearchParams ? extra.entries() : Object.entries(extra);
    for (const [key, value] of entries) {
      if (value != null && value !== '') parsed.searchParams.set(key, String(value));
    }
  }
  const path = (parsed.pathname.replace(/^\/hnn/, '') || '/').replace(/\/$/, '') || '/';
  return { path, searchParams: parsed.searchParams };
}

function filterOrders(orders, searchParams) {
  const status = searchParams.get('status');
  const manager = searchParams.get('manager');
  const material = searchParams.get('material');
  const teamNum = searchParams.get('teamNum');
  return orders.filter((order) => {
    if (status && order.state !== status) return false;
    if (manager === 'unassigned') {
      if (order.admin) return false;
    } else if (manager && order.admin !== manager) {
      return false;
    }
    if (material && order.material !== material) return false;
    if (teamNum && order.teamNum !== teamNum) return false;
    return true;
  });
}

function ok(data, status = 200) {
  return { data, status, statusText: 'OK' };
}

/**
 * axios adapter용 mock 핸들러
 * @returns {{ data: unknown, status: number, statusText: string }}
 */
export async function handleMockRequest(config) {
  await delay(150);

  const method = (config.method || 'get').toLowerCase();
  const { path, searchParams } = resolvePath(config);

  // --- Dashboard ---
  if (method === 'get' && path === '/index') {
    const end = new Date();
    end.setHours(end.getHours() + 2);
    end.setMinutes(end.getMinutes() + 15);
    return ok({
      ...mockDashboard,
      endTime: end.toISOString(),
    });
  }

  // --- Admin orders ---
  if (method === 'get' && path === '/admin/view') {
    return ok(filterOrders(store.orders, searchParams));
  }

  if (method === 'get' && path === '/register/getstate') {
    return ok(mockStatusList);
  }

  if (method === 'get' && path === '/register/getadminname') {
    return ok(mockAdminList);
  }

  const statusMatch = path.match(/^\/admin\/(\d+)\/status$/);
  if (method === 'patch' && statusMatch) {
    const orderId = Number(statusMatch[1]);
    const { status } = getBody(config);
    store.orders = store.orders.map((o) =>
      o.orderId === orderId ? { ...o, state: status } : o
    );
    return ok({ success: true });
  }

  const managerMatch = path.match(/^\/admin\/(\d+)\/manager$/);
  if (method === 'patch' && managerMatch) {
    const orderId = Number(managerMatch[1]);
    const body = getBody(config);
    store.orders = store.orders.map((o) =>
      o.orderId === orderId ? { ...o, admin: body.manager ?? '' } : o
    );
    return ok({ success: true });
  }

  const hideMatch = path.match(/^\/admin\/(\d+)\/hide$/);
  if (method === 'patch' && hideMatch) {
    return ok({ success: true });
  }

  // --- Submission ---
  if (method === 'get' && path === '/register/getmaterial') {
    return ok(mockMaterials);
  }

  if (method === 'post' && path === '/register') {
    const id = store.nextOrderId++;
    return ok({
      orderId: id,
      message: '접수가 완료되었습니다.',
    });
  }

  // --- Team lookup ---
  if (method === 'get' && path === '/checkStatus') {
    const teamNum = searchParams.get('teamNum') || '';
    if (!teamNum.trim()) {
      return ok([]);
    }
    // 아무 팀명이나 입력하면 샘플 결과 반환 (디자인용)
    return ok(mockTeamStatus.map((row) => ({ ...row })));
  }

  // --- Settings ---
  if (method === 'get' && path === '/admin/setting') {
    return ok(structuredClone(store.settings));
  }

  if (method === 'patch' && path === '/admin/setting') {
    const body = getBody(config);
    if (body.completedLimit != null) {
      store.settings.completedLimit = Number(body.completedLimit);
    }
    if (body.waitingLimit != null) {
      store.settings.waitingLimit = Number(body.waitingLimit);
    }
    return ok({ success: true });
  }

  if (method === 'post' && path === '/admin/create/message') {
    const body = getBody(config);
    store.settings.messages.push({
      messageId: store.nextMessageId++,
      content: body.content || '새 메시지',
      emergency: Boolean(body.emergency),
      display: body.display !== false,
    });
    return ok({ success: true });
  }

  if (method === 'post' && path === '/admin/create/material') {
    const body = getBody(config);
    store.settings.materials.push({
      materialId: store.nextMaterialId++,
      materialName: body.materialName || '새 재질',
      active: body.active !== false,
    });
    return ok({ success: true });
  }

  if (method === 'post' && path === '/admin/create/eventinfo') {
    const body = getBody(config);
    store.settings.eventInfos.push({
      eventId: store.nextEventId++,
      eventName: body.eventName || '새 대회',
      description: body.description || '',
      startTime: body.startTime || new Date().toISOString(),
      endTime: body.endTime || new Date().toISOString(),
      open: Boolean(body.isOpen ?? body.open),
    });
    return ok({ success: true });
  }

  const deleteMatch = path.match(/^\/admin\/delete\/(eventinfo|message|material)\/(\d+)$/);
  if (method === 'delete' && deleteMatch) {
    const [, type, idStr] = deleteMatch;
    const id = Number(idStr);
    if (type === 'eventinfo') {
      store.settings.eventInfos = store.settings.eventInfos.filter((e) => e.eventId !== id);
    } else if (type === 'message') {
      store.settings.messages = store.settings.messages.filter((m) => m.messageId !== id);
    } else if (type === 'material') {
      store.settings.materials = store.settings.materials.filter((m) => m.materialId !== id);
    }
    return ok({ success: true });
  }

  // --- Auth ---
  if (method === 'post' && path === '/admin/login') {
    return ok({ accessToken: 'mock-access-token' });
  }

  console.warn(`[mock] Unhandled ${method.toUpperCase()} ${path}`);
  return ok({ message: `Mock: unhandled ${method} ${path}` }, 404);
}
