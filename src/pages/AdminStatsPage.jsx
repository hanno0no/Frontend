// src/pages/AdminStatsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios.js';
import Header from '../components/Header.jsx';
import { STATUS_ORDER, getStatusLabel } from '../constants/status.js';
import { rankColors, BRAND_CORAL_PASTEL, BRAND_TEAL_PASTEL, DANGER_RED_PASTEL } from '../constants/chartPalette.js';
import LineTrendChart from '../components/charts/LineTrendChart.jsx';
import StatePieChart from '../components/charts/StatePieChart.jsx';
import CompletionMeter from '../components/charts/CompletionMeter.jsx';
import './AdminStatsPage.css';

const COMPLETED_STATES = ['print_complete', 'picked_up'];

// registered(접수 시각 기준)와 picked_up·failed(종결 상태)는 시간이 지나도 줄어들지 않으므로
// 누적합으로 보여줘야 의미가 있다. 나머지 상태는 스쳐 지나가는 단계라 카드·도넛(스냅샷)로 충분하다.
const CUMULATIVE_SERIES = [
    { code: 'registered', label: '누적 접수', color: BRAND_CORAL_PASTEL },
    { code: 'picked_up', label: '누적 완료', color: BRAND_TEAL_PASTEL },
    { code: 'failed', label: '누적 실패', color: DANGER_RED_PASTEL },
];

function toCumulativeTimeline(timeline, codes) {
    const running = Object.fromEntries(codes.map((c) => [c, 0]));
    return timeline.map((point) => {
        const cumulativePoint = { hour: point.hour };
        codes.forEach((code) => {
            running[code] += point[code] ?? 0;
            cumulativePoint[code] = running[code];
        });
        return cumulativePoint;
    });
}

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

    const byState = stats?.byState ?? {};
    const orderedStates = stats
        ? [...STATUS_ORDER, ...Object.keys(byState).filter((code) => !STATUS_ORDER.includes(code))]
        : [];
    const counts = orderedStates.map((code) => byState[code] ?? 0);
    const tileColors = rankColors(counts);

    const total = counts.reduce((sum, v) => sum + v, 0);
    const completed = COMPLETED_STATES.reduce((sum, code) => sum + (byState[code] ?? 0), 0);
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const pieData = orderedStates.map((code) => ({
        code,
        label: getStatusLabel(code),
        value: byState[code] ?? 0,
    }));

    const cumulativeTimeline = stats
        ? toCumulativeTimeline(stats.timeline, CUMULATIVE_SERIES.map((s) => s.code))
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
                        <>
                            <div className="stats-grid">
                                {orderedStates.map((code, i) => (
                                    <div key={code} className="stats-tile" style={{ backgroundColor: tileColors[i] }}>
                                        <span className="stats-tile-label">{getStatusLabel(code)}</span>
                                        <span className="stats-tile-count">{counts[i]}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="stats-charts">
                                <section className="stats-chart-card stats-chart-card--wide">
                                    <h2>누적 접수/완료/실패 추이</h2>
                                    <LineTrendChart data={cumulativeTimeline} granularity={stats.timelineGranularity} series={CUMULATIVE_SERIES} />
                                </section>

                                <section className="stats-chart-card">
                                    <h2>전체 비중</h2>
                                    <StatePieChart data={pieData} />
                                </section>

                                <section className="stats-chart-card">
                                    <h2>작업 완료율</h2>
                                    <CompletionMeter percent={completionPercent} completed={completed} total={total} />
                                </section>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminStatsPage;
