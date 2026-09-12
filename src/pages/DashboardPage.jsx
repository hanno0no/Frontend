import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '../components/Header';
import StatusCard from '../components/StatusCard';
import Clock from '../components/Clock';
import NoticeBoard from '../components/NoticeBoard';
import EmergencyBar from '../components/EmergencyBar';
import DashboardQrCard from '../components/DashboardQrCard';
import './DashboardPage.css';

import apiClient, { API_BASE_URL } from '../api/axios';
import { isMockMode } from '../mocks/isMock.js';
import { eventsUrl, isSseOpen } from '../hooks/sse.js';
import { useSSE } from '../hooks/useSSE.js';

/** 새로 완료된 항목을 강조 표시하는 시간(ms) */
const HIGHLIGHT_DURATION_MS = 3000;

function DashboardPage() {
    const [completedTeam, setCompletedTeam] = useState([]);
    const [waitingTeam, setWaitingTeam] = useState([]);
    const [endTime, setEndTime] = useState(null);
    const [emergencyMessage, setEmergencyMessage] = useState([]);
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [highlightedTeams, setHighlightedTeams] = useState(new Set());

    // null이면 "아직 첫 조회 전"이라는 뜻 — 첫 로드 시에는 강조하지 않는다.
    const prevCompletedRef = useRef(null);
    const highlightTimeoutsRef = useRef(new Map());

    const fetchData = useCallback(async () => {
        try {
            const response = await apiClient.get('/index');
            const data = response.data;

            if (prevCompletedRef.current !== null) {
                const prevSet = new Set(prevCompletedRef.current);
                const newlyCompleted = data.completedTeam.filter((team) => !prevSet.has(team));

                newlyCompleted.forEach((team) => {
                    const existingTimeout = highlightTimeoutsRef.current.get(team);
                    if (existingTimeout) clearTimeout(existingTimeout);

                    const timeoutId = setTimeout(() => {
                        setHighlightedTeams((prev) => {
                            const next = new Set(prev);
                            next.delete(team);
                            return next;
                        });
                        highlightTimeoutsRef.current.delete(team);
                    }, HIGHLIGHT_DURATION_MS);
                    highlightTimeoutsRef.current.set(team, timeoutId);
                });

                if (newlyCompleted.length > 0) {
                    setHighlightedTeams((prev) => new Set([...prev, ...newlyCompleted]));
                }
            }
            prevCompletedRef.current = data.completedTeam;

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

    useEffect(() => {
        const timeouts = highlightTimeoutsRef.current;
        return () => {
            timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        };
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
                    <StatusCard title="완료 명단" items={completedTeam} highlightedItems={highlightedTeams} />
                    <StatusCard title="대기 명단" items={waitingTeam} />
                    <DashboardQrCard />
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
