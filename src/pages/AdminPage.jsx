import React, { useState, useEffect, useMemo, useContext, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import apiClient, { API_BASE_URL } from '../api/axios';
import { buildAdminViewParams, UNASSIGNED_MANAGER, UNASSIGNED_MANAGER_LABEL } from '../api/adminViewParams';
import Header from '../components/Header';
import { buildStatusOptions, getStatusLabel } from '../constants/status';
import { isMockMode } from '../mocks/isMock.js';
import { eventsUrl, isSseOpen } from '../hooks/sse.js';
import { useSSE } from '../hooks/useSSE.js';
import './AdminPage.css';

function AdminPage() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const [statusList, setStatusList] = useState([]);
    const [adminList, setAdminList] = useState([]);
    const [materialList, setMaterialList] = useState([]);
    const [teamList, setTeamList] = useState([]);

    const [statusFilter, setStatusFilter] = useState('all');
    const [adminFilter, setAdminFilter] = useState('all');
    const [materialFilter, setMaterialFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');

    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const fetchSeq = useRef(0);
    const hasLoaded = useRef(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const fetchData = useCallback(async ({ soft = false } = {}) => {
        const seq = ++fetchSeq.current;
        if (soft) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        const params = buildAdminViewParams({
            status: statusFilter,
            manager: adminFilter,
            material: materialFilter,
            teamNum: teamFilter,
        });

        try {
            const ordersRes = await apiClient.get('/admin/view', { params });

            if (seq !== fetchSeq.current) return;

            setOrders(ordersRes.data);
            setError(null);
            hasLoaded.current = true;
        } catch (err) {
            if (seq !== fetchSeq.current) return;
            console.error("데이터 조회 에러:", err);
            if (err.response?.status === 401) {
                return;
            }
            setError("데이터를 불러오는 데 실패했습니다.");
        } finally {
            if (seq === fetchSeq.current) {
                if (soft) {
                    setIsRefreshing(false);
                } else {
                    setIsLoading(false);
                }
            }
        }
    }, [statusFilter, adminFilter, materialFilter, teamFilter]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [statusRes, adminRes, materialRes, allRes] = await Promise.all([
                    apiClient.get('/register/getstate'),
                    apiClient.get('/register/getadminname'),
                    apiClient.get('/register/getmaterial'),
                    apiClient.get('/admin/view'),
                ]);
                if (cancelled) return;
                setStatusList(statusRes.data);
                setAdminList(adminRes.data);
                setMaterialList(materialRes.data);
                setTeamList(
                    [...new Set(allRes.data.map((order) => order.teamNum).filter(Boolean))].sort()
                );
            } catch (err) {
                console.error("필터 옵션 조회 에러:", err);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        fetchData({ soft: hasLoaded.current });
    }, [fetchData]);

    const sseRef = useSSE(eventsUrl(API_BASE_URL), {
        orders_updated: () => { fetchData({ soft: true }); },
    }, {
        enabled: !isMockMode,
    });

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (!error && isSseOpen(sseRef.current)) return;
            fetchData({ soft: true });
        }, 5000);
        return () => clearInterval(intervalId);
    }, [error, fetchData, sseRef]);

    const handleRefresh = () => {
        fetchData({ soft: true });
    };

    const isFilterActive =
        statusFilter !== 'all' ||
        adminFilter !== 'all' ||
        materialFilter !== 'all' ||
        teamFilter !== 'all';

    const handleResetFilters = () => {
        setStatusFilter('all');
        setAdminFilter('all');
        setMaterialFilter('all');
        setTeamFilter('all');
    };

    const filterOptions = useMemo(() => {
        const withSelected = (values, selected) => {
            const set = new Set(values);
            if (selected && selected !== 'all') set.add(selected);
            return ['all', ...Array.from(set).sort()];
        };

        return {
            statuses: buildStatusOptions(statusList, statusFilter),
            admins: withSelected([UNASSIGNED_MANAGER, ...adminList], adminFilter),
            materials: withSelected(materialList.filter(Boolean), materialFilter),
            teams: withSelected(teamList, teamFilter),
        };
    }, [statusList, adminList, materialList, teamList, statusFilter, adminFilter, materialFilter, teamFilter]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await apiClient.patch(`/admin/${orderId}/status`, { status: newStatus });
            setOrders((prevOrders) => prevOrders.map((order) =>
                order.orderId === orderId ? { ...order, state: newStatus } : order
            ));
        } catch (err) {
            console.error("상태 업데이트 실패:", err);
            alert("상태 업데이트에 실패했습니다.");
        }
    };

    const handleManagerChange = async (orderId, newManager) => {
        const managerToSend = newManager === UNASSIGNED_MANAGER ? null : newManager;

        try {
            await apiClient.patch(`/admin/${orderId}/manager`, { manager: managerToSend });
            setOrders((prevOrders) => prevOrders.map((order) =>
                order.orderId === orderId ? { ...order, admin: managerToSend } : order
            ));
        } catch (err) {
            console.error("담당자 업데이트 실패:", err);
            alert("담당자 업데이트에 실패했습니다.");
        }
    };

    const renderPageContent = () => {
        if (isLoading) return <div>로딩 중...</div>;
        if (error) return <div className="error-message">{error}</div>;

        return (
            <div className="admin-page-card">

                {/* 필터링 UI */}
                <div className="filter-container">
                    <div className="filter-groups">
                        <div className="filter-group">
                            <label htmlFor="status-filter">상태별 조회:</label>
                            <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                {filterOptions.statuses.map(status => (
                                    <option key={status} value={status}>
                                        {status === 'all' ? '전체' : getStatusLabel(status)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="admin-filter">담당자별 조회:</label>
                            <select id="admin-filter" value={adminFilter} onChange={e => setAdminFilter(e.target.value)}>
                                {filterOptions.admins.map(admin => (
                                    <option key={admin} value={admin}>
                                        {admin === 'all' ? '전체' : admin === UNASSIGNED_MANAGER ? UNASSIGNED_MANAGER_LABEL : admin}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="material-filter">재질별 조회:</label>
                            <select id="material-filter" value={materialFilter} onChange={e => setMaterialFilter(e.target.value)}>
                                {filterOptions.materials.map(material => (
                                    <option key={material} value={material}>
                                        {material === 'all' ? '전체' : material}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <label htmlFor="team-filter">팀별 조회:</label>
                            <select id="team-filter" value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
                                {filterOptions.teams.map(team => (
                                    <option key={team} value={team}>
                                        {team === 'all' ? '전체' : team}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="filter-reset-button"
                            disabled={!isFilterActive}
                        >
                            필터 초기화
                        </button>
                    </div>
                    <div className="action-buttons">
                        <button
                            type="button"
                            onClick={handleRefresh}
                            className="admin-button"
                            disabled={isRefreshing}
                        >
                            {isRefreshing ? '새로고침 중...' : '새로고침'}
                        </button>
                        <Link to="/admin/stats" className="admin-button">작업 현황</Link>
                        <Link to="/admin/settings" className="admin-button">설정</Link>
                        <button onClick={handleLogout} className="admin-button logout">로그아웃</button>
                    </div>
                </div>

                {/* 주문 목록 테이블 */}
                <div className={`table-wrapper${isRefreshing ? ' is-refreshing' : ''}`}>
                    <table className="order-table">
                        <thead>
                            <tr>
                                <th>주문 ID</th>
                                <th>팀명</th>
                                <th>재질</th>
                                <th>파일명</th>
                                <th>담당자</th>
                                <th>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? (
                                orders.map(order => (
                                    <tr key={order.orderId}>
                                        <td>{order.orderId}</td>
                                        <td>{order.teamNum}</td>
                                        <td>{order.material}</td>
                                        <td>{order.fileName || '-'}</td>
                                        <td>
                                            <select
                                                className="table-select"
                                                value={order.admin || UNASSIGNED_MANAGER}
                                                onChange={(e) => handleManagerChange(order.orderId, e.target.value)}
                                            >
                                                <option value={UNASSIGNED_MANAGER}>{UNASSIGNED_MANAGER_LABEL}</option>
                                                {adminList.map(adminName => (
                                                    <option key={adminName} value={adminName}>{adminName}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                className="table-select"
                                                value={order.state}
                                                onChange={(e) => handleStatusChange(order.orderId, e.target.value)}
                                            >
                                                {statusList.map(statusValue => (
                                                    <option key={statusValue} value={statusValue}>
                                                        {getStatusLabel(statusValue)}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">표시할 주문이 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="page-container">
            <Header />
            <div className="main-content-area">
                {renderPageContent()}
            </div>
        </div>
    );
}

export default AdminPage;
