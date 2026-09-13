import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import apiClient, { API_BASE_URL } from '../api/axios';
import { buildAdminViewParams, UNASSIGNED_MANAGER, UNASSIGNED_MANAGER_LABEL } from '../api/adminViewParams';
import Header from '../components/Header';
import { buildStatusOptions, getStatusLabel, STATUS_ORDER } from '../constants/status';
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
    const [hiddenOrderIds, setHiddenOrderIds] = useState(new Set());
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const fetchSeq = useRef(0);
    const hasLoaded = useRef(false);

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

    const handleSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key !== key) return { key, direction: 'asc' };
            if (prev.direction === 'asc') return { key, direction: 'desc' };
            return { key: null, direction: 'asc' };
        });
    };

    const renderSortIndicator = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    };

    const sortedOrders = useMemo(() => {
        if (!sortConfig.key) return orders;

        const sign = sortConfig.direction === 'asc' ? 1 : -1;
        const statusRank = (state) => {
            const index = STATUS_ORDER.indexOf(state);
            return index === -1 ? STATUS_ORDER.length : index;
        };

        const compare = (a, b) => {
            switch (sortConfig.key) {
                case 'orderId':
                    return (a.orderId - b.orderId) * sign;
                case 'teamNum':
                    return String(a.teamNum ?? '').localeCompare(String(b.teamNum ?? ''), 'ko', { numeric: true }) * sign;
                case 'state':
                    return (statusRank(a.state) - statusRank(b.state)) * sign;
                default:
                    return 0;
            }
        };

        return [...orders].sort(compare);
    }, [orders, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, adminFilter, materialFilter, teamFilter, sortConfig, pageSize]);

    const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const pagedOrders = sortedOrders.slice((safePage - 1) * pageSize, safePage * pageSize);

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

    const handleMaterialChange = async (orderId, newMaterial) => {
        try {
            await apiClient.patch(`/admin/${orderId}/material`, { material: newMaterial });
            setOrders((prevOrders) => prevOrders.map((order) =>
                order.orderId === orderId ? { ...order, material: newMaterial } : order
            ));
        } catch (err) {
            console.error("재질 업데이트 실패:", err);
            alert("재질 업데이트에 실패했습니다.");
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

    const handleToggleHidden = async (orderId, hide) => {
        try {
            await apiClient.patch(`/admin/${orderId}/hide`, { hidden: hide });
            setHiddenOrderIds((prev) => {
                const next = new Set(prev);
                if (hide) {
                    next.add(orderId);
                } else {
                    next.delete(orderId);
                }
                return next;
            });
        } catch (err) {
            console.error("대시보드 노출 설정 실패:", err);
            alert("대시보드 노출 설정에 실패했습니다.");
        }
    };

    const renderTableBody = () => {
        if (isLoading) {
            return Array.from({ length: 6 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="skeleton-row">
                    {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <td key={cellIndex}><div className="skeleton-cell" /></td>
                    ))}
                </tr>
            ));
        }

        if (sortedOrders.length === 0) {
            return (
                <tr>
                    <td colSpan="7" className="empty-cell">표시할 주문이 없습니다.</td>
                </tr>
            );
        }

        return pagedOrders.map(order => {
            const isHidden = hiddenOrderIds.has(order.orderId);
            return (
            <tr key={order.orderId}>
                <td>{order.orderId}</td>
                <td>{order.teamNum}</td>
                <td>
                    <select
                        className="table-select"
                        value={order.material}
                        onChange={(e) => handleMaterialChange(order.orderId, e.target.value)}
                    >
                        {[...new Set([order.material, ...materialList.filter(Boolean)])].map(materialName => (
                            <option key={materialName} value={materialName}>{materialName}</option>
                        ))}
                    </select>
                </td>
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
                <td>
                    <button
                        type="button"
                        className="table-action-button"
                        onClick={() => handleToggleHidden(order.orderId, !isHidden)}
                    >
                        {isHidden ? '다시 표시' : '숨기기'}
                    </button>
                </td>
            </tr>
            );
        });
    };

    const renderPageContent = () => {
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
                </div>

                {/* 주문 목록 테이블 */}
                <div className={`table-wrapper${isRefreshing ? ' is-refreshing' : ''}`}>
                    <table className="order-table">
                        <thead>
                            <tr>
                                <th>
                                    <button type="button" className="sortable-header" onClick={() => handleSort('orderId')}>
                                        주문 ID{renderSortIndicator('orderId')}
                                    </button>
                                </th>
                                <th>
                                    <button type="button" className="sortable-header" onClick={() => handleSort('teamNum')}>
                                        팀명{renderSortIndicator('teamNum')}
                                    </button>
                                </th>
                                <th>재질</th>
                                <th>파일명</th>
                                <th>담당자</th>
                                <th>
                                    <button type="button" className="sortable-header" onClick={() => handleSort('state')}>
                                        상태{renderSortIndicator('state')}
                                    </button>
                                </th>
                                <th>대시보드 노출</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableBody()}
                        </tbody>
                    </table>
                </div>

                {!isLoading && sortedOrders.length > 0 && (
                    <div className="pagination-bar">
                        <div className="page-size-group">
                            <label htmlFor="page-size">페이지당 표시:</label>
                            <select
                                id="page-size"
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                            >
                                {[10, 20, 50].map(size => (
                                    <option key={size} value={size}>{size}건</option>
                                ))}
                            </select>
                        </div>
                        <div className="page-nav">
                            <button
                                type="button"
                                className="table-action-button"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={safePage <= 1}
                            >
                                이전
                            </button>
                            <span className="page-indicator">{safePage} / {totalPages}</span>
                            <button
                                type="button"
                                className="table-action-button"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={safePage >= totalPages}
                            >
                                다음
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="page-container">
            <Header onRefresh={handleRefresh} isRefreshing={isRefreshing} />
            <div className="main-content-area">
                {renderPageContent()}
            </div>
        </div>
    );
}

export default AdminPage;
