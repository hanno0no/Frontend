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
    const [allOrders, setAllOrders] = useState([]); // API로부터 받은 원본 주문 목록
    const [filteredOrders, setFilteredOrders] = useState([]); // 화면에 보여줄 필터링된 주문 목록
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // 필터 상태 관리
    const [statusFilter, setStatusFilter] = useState('all');
    const [adminFilter, setAdminFilter] = useState('all');

    // 컴포넌트가 처음 렌더링될 때 전체 주문 목록을 불러옵니다.
    useEffect(() => {
        const fetchAllOrders = async () => {
            setIsLoading(true);
            try {
                // 실제 관리자용 전체 주문 목록 API 엔드포인트로 수정해야 합니다.
                const response = await apiClient.get('/admin/views');
                setAllOrders(response.data);
                setFilteredOrders(response.data); // 처음에는 모든 목록을 보여줌
            } catch (err) {
                console.error("주문 목록 조회 에러:", err);
                setError("주문 목록을 불러오는 데 실패했습니다.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllOrders();
    }, []);

    // 필터 값이 변경될 때마다 filteredOrders를 다시 계산합니다.
    useEffect(() => {
        let result = allOrders;

        if (statusFilter !== 'all') {
            result = result.filter(order => order.state === statusFilter);
        }

        if (adminFilter !== 'all') {
            // '미지정' 필터 처리: admin이 비어있거나 null인 경우
            if (adminFilter === '미지정') {
                result = result.filter(order => !order.admin);
            } else {
                result = result.filter(order => order.admin === adminFilter);
            }
        }

        setFilteredOrders(result);
    }, [statusFilter, adminFilter, allOrders]);


    // useMemo를 사용해 필터 옵션을 계산하여 불필요한 재계산을 방지합니다.
    const filterOptions = useMemo(() => {
        const statuses = new Set(allOrders.map(order => order.state));
        const admins = new Set(allOrders.map(order => order.admin || '미지정'));
        return {
            statuses: ['all', ...Array.from(statuses)],
            admins: ['all', ...Array.from(admins)],
        };
    }, [allOrders]);

    if (isLoading) return <div>로딩 중...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="page-container">
            <Header />
            <div className="main-content-area">
                <div className="admin-page-card">
                    <h1 className="page-title">관리자 주문 현황</h1>

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
                                            <td>{order.admin || '미지정'}</td>
                                            <td>{statusMap[order.state] || order.state}</td>
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
            </div>
        </div>
    );
}

export default AdminPage;
