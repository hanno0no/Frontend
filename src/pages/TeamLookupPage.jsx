// src/pages/TeamLookupPage.jsx
import React, { useState } from 'react';
import apiClient from '../api/axios';
import { Link } from 'react-router-dom';
import './TeamLookupPage.css'; // 페이지 전용 CSS

import Header from '../components/Header';

function TeamLookupPage() {
    const [teamName, setTeamName] = useState('');      // 검색어 state
    const [teamData, setTeamData] = useState(null);    // API 응답 결과 state
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 state
    const [error, setError] = useState(null);          // 에러 state

    const statusMap = {
        submission: '제출 완료',
        register: '접수 완료',
        design: '디자인 완료',
        print: '출력 완료',
        // 필요에 따라 다른 상태들을 추가할 수 있습니다.
        rejection: '실패',
    };

    // 검색 버튼 클릭 또는 Enter 키를 눌렀을 때 실행될 함수
    const handleSearch = async (e) => {
        e.preventDefault(); // form의 기본 제출 동작(새로고침) 방지
        if (!teamName.trim()) {
            alert('팀 이름을 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setTeamData(null);

        try {
            // API 명세서에 맞는 팀 조회 엔드포인트로 수정해주세요.
            // 예: /api/teams/T2_2
            const response = await apiClient.get(`/checkStatus?teamNum=${teamName}`);
            setTeamData(response.data);
        } catch (err) {
            console.error('팀 정보 조회 에러:', err);
            setError('해당 팀을 찾을 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='page-container'>
            <Header />
            <div className="main-content-area">
                <div className="lookup-card">
                    <h1 className="page-title">진행 현황 확인 페이지</h1>

                    <form onSubmit={handleSearch} className="lookup-form">
                        <label htmlFor="team-input" className="input-label"></label>
                        <div className="input-wrapper">
                            <input
                                id="team-input"
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="팀명을 입력해주세요"
                                className="lookup-input"
                            />
                            {teamName && <button type="button" onClick={() => setTeamName('')} className="clear-button">×</button>}
                        </div>
                        <p className="input-helper-text"></p>
                        <button type="submit" className="submit-button" disabled={isLoading}>
                            {isLoading ? '입력 중...' : '확인'}
                        </button>
                    </form>

                    {/* 구분선 추가 */}
                    <hr className="divider" />

                    {/* 결과 표시 부분을 같은 카드 안으로 이동 */}
                    <div className="result-area">
                        {isLoading && <p>데이터를 불러오는 중입니다...</p>}
                        {error && <p className="error-message">{error}</p>}

                        {teamData && teamData.length > 0 && (
                            // ✅ table 태그의 scrollable 클래스를 제거해도 좋습니다.
                            <table className="result-table">
                                <thead>
                                    <tr>
                                        <th>번호</th>
                                        <th>재질</th>
                                        <th>제작 상태</th>
                                        <th>주문시간</th>
                                    </tr>
                                </thead>
                                {/* ✅ tbody를 감싸던 div를 제거하고 원래의 tbody 태그를 사용합니다. */}
                                <tbody>
                                    {teamData.map((order, index) => (
                                        <tr key={order.orderId}>
                                            <td>{index + 1}</td>
                                            <td>{order.material}</td>
                                            <td>{statusMap[order.status] || order.status}</td>
                                            <td>{new Date(order.orderTime).toLocaleString('ko-KR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {teamData && teamData.length === 0 && (
                            <p>해당 팀의 주문 내역이 없습니다.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TeamLookupPage;