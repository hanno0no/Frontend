// src/api/axios.js
import axios from 'axios';

// Axios 인스턴스 생성
const client = axios.create({
  // API 명세서에 명시된 백엔드 서버 주소를 입력합니다.
  baseURL: 'http://localhost:8080/hnn', // 예시 URL입니다. 실제 주소에 맞게 수정해주세요.
  timeout: 10000, // 요청 타임아웃
});

export default client;