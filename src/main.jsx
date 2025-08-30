// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom'; // 라우터 import
import App from './App.jsx';
import './index.css';
import SubmissionPage from './pages/SubmissionPage.jsx';

// 임시로 만들 관리자 페이지 import (아래에서 생성할 예정)
import AdminPage from './pages/AdminPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TeamLookupPage from './pages/TeamLookupPage.jsx';

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
        path: 'admin', // '/admin' 경로일 때 보여줄 페이지
        element: <AdminPage />,
      },
      { 
        path: 'team-lookup',
        element: <TeamLookupPage />,
      },
      { 
        path: 'submission', 
        element: <SubmissionPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);