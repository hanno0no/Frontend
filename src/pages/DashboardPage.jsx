import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import StatusCard from '../components/StatusCard';
import Clock from '../components/Clock';
import NoticeBoard from '../components/NoticeBoard';
import EmergencyBar from '../components/EmergencyBar';
import './DashboardPage.css';

import apiClient from '../api/axios'

function DashboardPage() {

    const [completedTeam, setCompletedTeam] = useState([]);
    const [waitingTeam, setWaitingTeam] = useState([]);
    const [endTime, setEndTime] = useState(null);
    const [emergencyMessage, setEmergencyMessage] = useState([]);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);


    // 데이터를 가져오는 함수
    const fetchData = async () => {
        try {
            // 이제 API를 한 번만 호출합니다. API 명세서에 맞는 엔드포인트로 수정하세요.
            const response = await apiClient.get('/index');
            const data = response.data;

            // 받아온 데이터로 각 state를 업데이트합니다.
            setCompletedTeam(data.completedTeam);
            setWaitingTeam(data.waitingTeam);
            setEndTime(data.endTime);
            setEmergencyMessage(data.emergencyMessage);
            setMessages(data.messages);
            setError(null);

        } catch (err) {
            console.error("데이터를 불러오는 중 에러 발생:", err);
            setError("데이터를 불러오는 데 실패했습니다.");
        }
    };


    useEffect(() => {
        fetchData();
        const intervalId = setInterval(fetchData, 5000); // 5초마다 데이터 새로고침
        return () => clearInterval(intervalId);
    }, []);

    if (error) {
        return <div>{error}</div>;
    }


    return (
        <div className="dashboard-layout">
            {/* emergencyMessage가 있을 때만 EmergencyBar를 보여줍니다. */}
            {emergencyMessage && emergencyMessage.length > 0 && (
                <EmergencyBar messages={emergencyMessage} />
            )}
            <Header />

            <main className="dashboard-main">
                <div className="sidebar-container">
                    <StatusCard title="완료 명단" items={completedTeam} />
                    <StatusCard title="대기 명단" items={waitingTeam} />
                </div>

                <div className="content-container">
                    {/* endTime이 있을 때만 Clock 컴포넌트에 전달합니다. */}
                    {endTime && <Clock endTime={endTime} />}
                    <NoticeBoard messages={messages} />
                </div>
            </main>
        </div>
    );
}

export default DashboardPage;