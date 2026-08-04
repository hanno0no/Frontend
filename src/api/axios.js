import axios from 'axios';
import { isMockMode } from '../mocks/isMock.js';
import { handleMockRequest } from '../mocks/handler.js';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://backend-production-2949.up.railway.app/hnn',
  timeout: 10000,
});

/** AuthContext에서 등록: 401 시 로그아웃 + /login 이동 */
let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function isLoginRequest(config) {
  const url = config?.url || '';
  return url.includes('/admin/login');
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      !isMockMode &&
      error.response?.status === 401 &&
      !isLoginRequest(error.config)
    ) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

if (isMockMode) {
  console.info('[mock] API mock mode ON — 백엔드 대신 샘플 데이터를 사용합니다.');

  client.defaults.adapter = async (config) => {
    const result = await handleMockRequest(config);
    return {
      data: result.data,
      status: result.status,
      statusText: result.statusText,
      headers: { 'content-type': 'application/json' },
      config,
      request: {},
    };
  };
}

export default client;
