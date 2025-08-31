import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../api/axios'; // axios 인스턴스를 가져옵니다.

export const AuthContext = createContext(null);

// axios의 기본 헤더를 설정하는 함수
const setAuthToken = (token) => {
  if (token) {
    // 토큰이 있으면, 모든 axios 요청 헤더에 'Authorization'을 추가합니다.
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    // 토큰이 없으면, 'Authorization' 헤더를 삭제합니다.
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export function AuthProvider({ children }) {
  // user state에 사용자 정보와 토큰을 함께 저장합니다.
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 앱 로딩 상태

  // 앱이 처음 시작될 때 localStorage에서 토큰을 확인합니다.
  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (storedToken) {
      // 저장된 토큰이 있으면 사용자 정보를 설정하고 axios 헤더도 설정합니다.
      // 실제 앱에서는 토큰으로 사용자 정보를 다시 조회하는 API를 호출하는 것이 좋습니다.
      // 여기서는 간단하게 토큰 자체를 사용자 정보의 일부로 간주합니다.
      setUser({ token: storedToken });
      setAuthToken(storedToken);
    }
    setIsLoading(false); // 로딩 완료
  }, []);

  // 로그인 함수
  const login = (userData) => {
    const token = userData.accessToken; // 서버 응답에 accessToken이 있다고 가정
    localStorage.setItem('accessToken', token); // 토큰을 localStorage에 저장
    setAuthToken(token); // axios 헤더에 토큰 설정
    setUser({ token }); // 사용자 상태 업데이트
  };

  // 로그아웃 함수
  const logout = () => {
    localStorage.removeItem('accessToken'); // localStorage에서 토큰 삭제
    setAuthToken(null); // axios 헤더에서 토큰 제거
    setUser(null); // 사용자 상태 초기화
  };

  // 로딩 중일 때는 아무것도 표시하지 않아 잠시 흰 화면이 보일 수 있습니다.
  if (isLoading) {
    return null; 
  }

  const value = { user, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
