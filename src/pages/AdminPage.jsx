// src/pages/AdminPage.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Link import

function AdminPage() {
    const pageStyle = {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#333',
        color: 'white',
    };

    return (
        <div style={pageStyle}>
            <h1>관리자 페이지</h1>
            <p>이 페이지는 관리자만 접근할 수 있습니다.</p>
            <Link to="/" style={{ color: '#FFC700' }}>대시보드로 돌아가기</Link>
        </div>
    );
}

export default AdminPage;