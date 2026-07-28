import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import apiClient from '../api/axios';
import Header from '../components/Header';
import { buildStatusOptions, getStatusLabel } from '../constants/status';
import './AdminPage.css';

function AdminPage() {
    // State 관리
    const [allOrders, setAllOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // 필터 및 수정용 드롭다운 목록 State
    const [statusList, setStatusList] = useState([]);
    const [adminList, setAdminList] = useState([]);

    // 필터 상태 관리 (새로고침 시에도 유지)
    const [statusFilter, setStatusFilter] = useState('all');
    const [adminFilter, setAdminFilter] = useState('all');
    const [materialFilter, setMaterialFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('all');

    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const fetchData = useCallback(async ({ soft = false } = {}) => {
        if (soft) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const [ordersRes, statusRes, adminRes] = await Promise.all([
                apiClient.get('/admin/view'),
                apiClient.get('/register/getstate'),
                apiClient.get('/register/getadminname')
            ]);

            // allOrders만 갱신 → 필터 state는 건드리지 않음
            // filteredOrders는 아래 필터링 useEffect가 자동 재적용
            setAllOrders(ordersRes.data);
            setStatusList(statusRes.data);
            setAdminList(adminRes.data);
            setError(null);
        } catch (err) {
            console.error("데이터 조회 에러:", err);
            setError("데이터를 불러오는 데 실패했습니다.");
        } finally {
            if (soft) {
                setIsRefreshing(false);
            } else {
                setIsLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

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

    // 필터링 로직
    useEffect(() => {
        let result = allOrders;
        if (statusFilter !== 'all') {
            result = result.filter(order => order.state === statusFilter);
        }
        if (adminFilter !== 'all') {
            if (adminFilter === '미지정') {
                result = result.filter(order => !order.admin);
            } else {
                result = result.filter(order => order.admin === adminFilter);
            }
        }
        if (materialFilter !== 'all') {
            result = result.filter(order => order.material === materialFilter);
        }
        if (teamFilter !== 'all') {
            result = result.filter(order => order.teamNum === teamFilter);
        }
        setFilteredOrders(result);
    }, [statusFilter, adminFilter, materialFilter, teamFilter, allOrders]);

    // 필터 옵션 생성 (선택된 값이 새 데이터에 없어도 유지)
    const filterOptions = useMemo(() => {
        const withSelected = (values, selected) => {
            const set = new Set(values);
            if (selected && selected !== 'all') set.add(selected);
            return ['all', ...Array.from(set).sort()];
        };

        return {
            statuses: buildStatusOptions(
                allOrders.map(order => order.state),
                statusFilter
            ),
            admins: withSelected(allOrders.map(order => order.admin || '미지정'), adminFilter),
            materials: withSelected(
                allOrders.map(order => order.material).filter(Boolean),
                materialFilter
            ),
            teams: withSelected(
                allOrders.map(order => order.teamNum).filter(Boolean),
                teamFilter
            ),
        };
    }, [allOrders, statusFilter, adminFilter, materialFilter, teamFilter]);

    // 상태 업데이트 핸들러
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await apiClient.patch(`/admin/${orderId}/status`, { status: newStatus });

            const updateOrders = (orders) => orders.map(order =>
                order.orderId === orderId ? { ...order, state: newStatus } : order
            );
            setAllOrders(prevOrders => updateOrders(prevOrders));

        } catch (err) {
            console.error("상태 업데이트 실패:", err);
            alert("상태 업데이트에 실패했습니다.");
        }
    };

    // 담당자 업데이트 핸들러
    const handleManagerChange = async (orderId, newManager) => {
        const managerToSend = newManager === '미지정' ? '' : newManager;

        try {
            await apiClient.patch(`/admin/${orderId}/manager`, { manager: managerToSend });

            const updateOrders = (orders) => orders.map(order =>
                order.orderId === orderId ? { ...order, admin: managerToSend } : order
            );
            setAllOrders(prevOrders => updateOrders(prevOrders));

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
                                        {admin === 'all' ? '전체' : admin}
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
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map(order => (
                                    <tr key={order.orderId}>
                                        <td>{order.orderId}</td>
                                        <td>{order.teamNum}</td>
                                        <td>{order.material}</td>
                                        <td>{order.fileName || '-'}</td>
                                        <td>
                                            <select
                                                className="table-select"
                                                value={order.admin || '미지정'}
                                                onChange={(e) => handleManagerChange(order.orderId, e.target.value)}
                                            >
                                                <option value="미지정">미지정</option>
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
