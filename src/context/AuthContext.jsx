import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient, { setUnauthorizedHandler } from '../api/axios';
import { isMockMode } from '../mocks/isMock.js';

export const AuthContext = createContext(null);

const MOCK_TOKEN = 'mock-access-token';

const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const handlingUnauthorized = useRef(false);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setAuthToken(null);
    setUser(null);
  }, []);

  const handleUnauthorized = useCallback(() => {
    if (handlingUnauthorized.current || isMockMode) return;
    if (window.location.pathname === '/login') return;

    handlingUnauthorized.current = true;
    logout();

    const from = `${window.location.pathname}${window.location.search}`;
    window.location.replace(`/login?from=${encodeURIComponent(from)}`);
  }, [logout]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  useEffect(() => {
    if (isMockMode) {
      // 디자인용: 최초 진입 시 관리자 페이지로 바로 들어갈 수 있게 로그인 상태 유지
      // (로그아웃 후엔 로그인 화면 확인 가능 — 아무 계정이나 통과)
      const storedToken = localStorage.getItem('accessToken') || MOCK_TOKEN;
      localStorage.setItem('accessToken', storedToken);
      setUser({ token: storedToken });
      setAuthToken(storedToken);
      setIsLoading(false);
      return;
    }

    const storedToken = localStorage.getItem('accessToken');
    // mock 모드에서 남은 토큰은 실제 API 연동 시 401을 유발하므로 무시
    if (storedToken && storedToken !== MOCK_TOKEN) {
      setUser({ token: storedToken });
      setAuthToken(storedToken);
    } else if (storedToken === MOCK_TOKEN) {
      localStorage.removeItem('accessToken');
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    const token = userData.accessToken;
    localStorage.setItem('accessToken', token);
    setAuthToken(token);
    setUser({ token });
    handlingUnauthorized.current = false;
  };

  if (isLoading) {
    return null;
  }

  const value = { user, login, logout, isMockMode };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
