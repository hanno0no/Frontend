// src/components/ProtectedRoute.jsx
import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    // 로그인하지 않았다면, 로그인 페이지로 보냄
    // 현재 경로를 state에 저장하여 로그인 후 다시 돌아올 수 있도록 함
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 로그인했다면, 요청한 페이지(children)를 보여줌
  return children;
}

export default ProtectedRoute;