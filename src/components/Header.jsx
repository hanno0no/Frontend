// src/components/Header.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';

function Header({ onRefresh, isRefreshing } = {}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const authPath = user ? '/admin' : '/login';

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="header-container">
            <div className="logo-section">
                <h1 onClick={toggleDropdown} className="logo-title">
                    HNN
                </h1>

                {isDropdownOpen && (
                    <nav className="dropdown-menu">
                        <ul>
                            <li>
                                <Link to="/" onClick={() => setIsDropdownOpen(false)}>HNN</Link>
                            </li>
                            <li>
                                <Link to="/submission" onClick={() => setIsDropdownOpen(false)}>접수 신청</Link>
                            </li>
                            <li>
                                <Link to="/team-lookup" onClick={() => setIsDropdownOpen(false)}>팀별 조회</Link>
                            </li>
                            <li>
                                <Link to={authPath} onClick={() => setIsDropdownOpen(false)}>{user ? '관리자 페이지' : '로그인'}</Link>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>

            {user && isAdminRoute && (
                <nav className="header-admin-actions">
                    {onRefresh && (
                        <button type="button" onClick={onRefresh} className="header-admin-link" disabled={isRefreshing}>
                            {isRefreshing ? '새로고침 중...' : '새로고침'}
                        </button>
                    )}
                    <Link to="/admin/stats" className="header-admin-link">작업 현황</Link>
                    <Link to="/admin/teams" className="header-admin-link">팀 관리</Link>
                    <Link to="/admin/settings" className="header-admin-link">설정</Link>
                    <button type="button" onClick={handleLogout} className="header-admin-link">로그아웃</button>
                </nav>
            )}
        </header>
    );
}

export default Header;
