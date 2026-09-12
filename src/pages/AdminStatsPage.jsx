// src/pages/AdminStatsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios.js';
import Header from '../components/Header.jsx';
import { STATUS_ORDER, getStatusLabel } from '../constants/status.js';
import './AdminStatsPage.css';

function AdminStatsPage() {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/admin/stats');
            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error("작업 현황 통계 조회 에러:", err);
            if (err.response?.status === 401) {
                return;
            }
            setError("작업 현황 통계를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const orderedStates = stats
        ? [...STATUS_ORDER, ...Object.keys(stats).filter((code) => !STATUS_ORDER.includes(code))]
        : [];

    return (
        <div className="page-container">
            <Header />
            <div className="main-content-area">
                <div className="stats-page-card">
                    <div className="stats-header">
                        <h1>작업 현황 통계</h1>
                        <div className="stats-header-actions">
                            <button type="button" onClick={fetchStats} className="admin-button" disabled={isLoading}>
                                새로고침
                            </button>
                            <Link to="/admin" className="admin-button">목록으로</Link>
                        </div>
                    </div>

                    {isLoading && <div>로딩 중...</div>}
                    {error && <div className="error-message">{error}</div>}

                    {!isLoading && !error && stats && (
                        <div className="stats-grid">
                            {orderedStates.map((code) => (
                                <div key={code} className="stats-tile">
                                    <span className="stats-tile-label">{getStatusLabel(code)}</span>
                                    <span className="stats-tile-count">{stats[code] ?? 0}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminStatsPage;
