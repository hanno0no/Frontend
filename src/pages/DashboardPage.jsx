import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import StatusCard from '../components/StatusCard';
import Clock from '../components/Clock';
import NoticeBoard from '../components/NoticeBoard';
import EmergencyBar from '../components/EmergencyBar';
import './DashboardPage.css';

import apiClient, { API_BASE_URL } from '../api/axios';
import { isMockMode } from '../mocks/isMock.js';
import { eventsUrl, isSseOpen } from '../hooks/sse.js';
import { useSSE } from '../hooks/useSSE.js';

function DashboardPage() {
    const [completedTeam, setCompletedTeam] = useState([]);
    const [waitingTeam, setWaitingTeam] = useState([]);
    const [endTime, setEndTime] = useState(null);
    const [emergencyMessage, setEmergencyMessage] = useState([]);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const response = await apiClient.get('/index');
            const data = response.data;
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
    }, []);

    const sseRef = useSSE(eventsUrl(API_BASE_URL), {
        index_updated: () => { fetchData(); },
    }, {
        enabled: !isMockMode,
    });

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (!error && isSseOpen(sseRef.current)) return;
            fetchData();
        }, 5000);
        return () => clearInterval(intervalId);
    }, [error, fetchData, sseRef]);

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="dashboard-layout">
            {emergencyMessage && emergencyMessage.length > 0 && (
                <EmergencyBar messages={emergencyMessage} />
            )}
            <Header />
            <div className="dashboard-toolbar">
                <button type="button" onClick={fetchData}>새로고침</button>
            </div>
            <main className="dashboard-main">
                <div className="sidebar-container">
                    <StatusCard title="완료 명단" items={completedTeam} />
                    <StatusCard title="대기 명단" items={waitingTeam} />
                </div>
                <div className="content-container">
                    {endTime && <Clock endTime={endTime} />}
                    <NoticeBoard messages={messages} />
                </div>
            </main>
        </div>
    );
}

export default DashboardPage;
