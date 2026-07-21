import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/axios';
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
    if (storedToken) {
      setUser({ token: storedToken });
      setAuthToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = (userData) => {
    const token = userData.accessToken;
    localStorage.setItem('accessToken', token);
    setAuthToken(token);
    setUser({ token });
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setAuthToken(null);
    setUser(null);
  };

  if (isLoading) {
    return null;
  }

  const value = { user, login, logout, isMockMode };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
