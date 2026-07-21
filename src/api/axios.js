import axios from 'axios';
import { isMockMode } from '../mocks/isMock.js';
import { handleMockRequest } from '../mocks/handler.js';

const client = axios.create({
  baseURL: 'https://backend-production-2949.up.railway.app/hnn',
  timeout: 10000,
});

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
