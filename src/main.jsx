// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom'; // 라우터 import
import { AuthProvider } from './context/AuthContext';

import App from './App.jsx';
import './index.css';
import SubmissionPage from './pages/SubmissionPage.jsx';

// 임시로 만들 관리자 페이지 import (아래에서 생성할 예정)
import AdminPage from './pages/AdminPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TeamLookupPage from './pages/TeamLookupPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminSettingPage from './pages/AdminSettingsPage.jsx';


// 라우터 경로 설정
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true, // 기본 경로 ('/')일 때 보여줄 페이지
        element: <DashboardPage />,
      },
      {
        path: 'admin',
        // AdminPage를 ProtectedRoute로 감쌉니다.
        element: (
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'team-lookup',
        element: <TeamLookupPage />,
      },
      {
        path: 'submission',
        element: <SubmissionPage />,
      },
      {
        // 로그인 페이지는 App 레이아웃(헤더 등) 바깥에 독립적으로 존재
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: 'admin/settings',
        element: (
          <ProtectedRoute>
            <AdminSettingPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* AuthProvider로 감싸서 앱 전체에서 로그인 정보 공유 */}
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);