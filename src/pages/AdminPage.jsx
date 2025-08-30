import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../api/axios';
import Header from '../components/Header';
import './AdminPage.css';

// 상태(state) 값을 한글로 변환하기 위한 객체
const statusMap = {
    submission: '제출완료',
    register: '접수완료',
    design: '디자인완료',
    print: '출력완료',
    rejection: '실패',
};

function AdminPage() {
    // State 관리
    const [allOrders, setAllOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 필터 및 수정용 드롭다운 목록 State
    const [statusList, setStatusList] = useState([]);
    const [adminList, setAdminList] = useState([]);
    
    // 필터 상태 관리
    const [statusFilter, setStatusFilter] = useState('all');
    const [adminFilter, setAdminFilter] = useState('all');

    // 컴포넌트가 처음 렌더링될 때 모든 데이터를 불러옵니다.
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Promise.all을 사용해 여러 API를 동시에 호출합니다.
                const [ordersRes, statusRes, adminRes] = await Promise.all([
                    apiClient.get('/admin/view'),
                    apiClient.get('/registar/getstate'),
                    apiClient.get('/registar/getadminname')
                ]);

                setAllOrders(ordersRes.data);
                setFilteredOrders(ordersRes.data);
                setStatusList(statusRes.data);
                setAdminList(adminRes.data);

            } catch (err) {
                console.error("데이터 조회 에러:", err);
                setError("데이터를 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // 필터링 로직 (기존과 동일)
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
        setFilteredOrders(result);
    }, [statusFilter, adminFilter, allOrders]);

    // 필터 옵션 생성 (기존과 동일)
    const filterOptions = useMemo(() => {
        const statuses = new Set(allOrders.map(order => order.state));
        const admins = new Set(allOrders.map(order => order.admin || '미지정'));
        return {
            statuses: ['all', ...Array.from(statuses)],
            admins: ['all', ...Array.from(admins)],
        };
    }, [allOrders]);
    
    // 상태 업데이트 핸들러
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await apiClient.patch(`/admin/${orderId}/status`, { status: newStatus });
            
            // API 성공 시, 화면의 데이터를 즉시 업데이트하여 새로고침 효과를 줍니다.
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
        // "미지정" 옵션을 선택한 경우, 빈 문자열로 서버에 보냅니다.
        const managerToSend = newManager === '미지정' ? '' : newManager;

        try {
            await apiClient.patch(`/admin/${orderId}/manager`, { manager: managerToSend });

            // API 성공 시, 화면의 데이터를 즉시 업데이트합니다.
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
                    <div className="filter-group">
                        <label htmlFor="status-filter">상태별 조회:</label>
                        <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            {filterOptions.statuses.map(status => (
                                <option key={status} value={status}>
                                    {status === 'all' ? '전체' : (statusMap[status] || status)}
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
                </div>

                {/* 주문 목록 테이블 */}
                <div className="table-wrapper">
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
                                                        {statusMap[statusValue] || statusValue}
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

