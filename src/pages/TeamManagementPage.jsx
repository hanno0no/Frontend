import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios.js';
import Header from '../components/Header.jsx';
import './TeamManagementPage.css';

const PHONE_PATTERN = /^010-\d{4}-\d{4}$/;

function TeamManagementPage() {
    const [teams, setTeams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const [newTeamNum, setNewTeamNum] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [editingPhones, setEditingPhones] = useState({});

    const fetchTeams = useCallback(async ({ soft = false } = {}) => {
        if (soft) setIsRefreshing(true); else setIsLoading(true);
        try {
            const res = await apiClient.get('/admin/teams');
            setTeams(res.data);
            setError(null);
        } catch (err) {
            console.error('팀 목록 조회 에러:', err);
            if (err.response?.status === 401) return;
            setError('팀 목록을 불러오는 데 실패했습니다.');
        } finally {
            if (soft) setIsRefreshing(false); else setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    const handleRefresh = () => fetchTeams({ soft: true });

    const handleCreate = async (e) => {
        e.preventDefault();
        const teamNum = newTeamNum.trim();
        const phone = newPhone.trim();

        if (!teamNum) {
            alert('팀 번호를 입력해주세요.');
            return;
        }
        if (phone && !PHONE_PATTERN.test(phone)) {
            alert('연락처는 010-0000-0000 형식으로 입력해주세요.');
            return;
        }

        try {
            await apiClient.post('/admin/teams', { teamNum, phoneNumber: phone || null });
            setNewTeamNum('');
            setNewPhone('');
            fetchTeams({ soft: true });
        } catch (err) {
            console.error('팀 등록 에러:', err);
            alert(err.response?.data?.message || '팀 등록에 실패했습니다.');
        }
    };

    const getPhoneValue = (team) =>
        editingPhones[team.teamNum] !== undefined ? editingPhones[team.teamNum] : (team.phoneNumber || '');

    const handlePhoneInputChange = (teamNum, value) => {
        setEditingPhones((prev) => ({ ...prev, [teamNum]: value }));
    };

    const handleSavePhone = async (teamNum) => {
        const phone = (editingPhones[teamNum] ?? '').trim();
        if (phone && !PHONE_PATTERN.test(phone)) {
            alert('연락처는 010-0000-0000 형식으로 입력해주세요.');
            return;
        }
        try {
            await apiClient.patch(`/admin/teams/${teamNum}`, { phoneNumber: phone || null });
            setEditingPhones((prev) => {
                const next = { ...prev };
                delete next[teamNum];
                return next;
            });
            fetchTeams({ soft: true });
        } catch (err) {
            console.error('팀 수정 에러:', err);
            alert(err.response?.data?.message || '팀 수정에 실패했습니다.');
        }
    };

    const handleDelete = async (teamNum) => {
        if (!window.confirm(`${teamNum} 팀을 삭제하시겠습니까?`)) return;
        try {
            await apiClient.delete(`/admin/teams/${teamNum}`);
            fetchTeams({ soft: true });
        } catch (err) {
            console.error('팀 삭제 에러:', err);
            alert(err.response?.data?.message || '팀 삭제에 실패했습니다.');
        }
    };

    const renderContent = () => {
        if (isLoading) return <div>로딩 중...</div>;
        if (error) return <div className="error-message">{error}</div>;

        return (
            <div className="team-page-card">
                <div className="team-page-header">
                    <h1>팀 관리</h1>
                    <Link to="/admin" className="team-header-link">목록으로</Link>
                </div>

                <form className="team-create-form" onSubmit={handleCreate}>
                    <div className="form-field">
                        <label htmlFor="new-team-num">팀 번호</label>
                        <input
                            id="new-team-num"
                            type="text"
                            value={newTeamNum}
                            onChange={(e) => setNewTeamNum(e.target.value)}
                            placeholder="예: T1"
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="new-team-phone">연락처 (선택)</label>
                        <input
                            id="new-team-phone"
                            type="text"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder="010-0000-0000"
                        />
                    </div>
                    <button type="submit" className="team-submit-button">팀 등록</button>
                </form>

                <table className="team-table">
                    <thead>
                        <tr>
                            <th>팀 번호</th>
                            <th>연락처</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {teams.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="empty-cell">등록된 팀이 없습니다.</td>
                            </tr>
                        ) : teams.map((team) => (
                            <tr key={team.teamNum}>
                                <td>{team.teamNum}</td>
                                <td>
                                    <input
                                        type="text"
                                        className="team-phone-input"
                                        value={getPhoneValue(team)}
                                        onChange={(e) => handlePhoneInputChange(team.teamNum, e.target.value)}
                                        placeholder="010-0000-0000"
                                    />
                                </td>
                                <td className="team-row-actions">
                                    <button type="button" className="team-action-button" onClick={() => handleSavePhone(team.teamNum)}>
                                        저장
                                    </button>
                                    <button type="button" className="team-action-button team-action-delete" onClick={() => handleDelete(team.teamNum)}>
                                        삭제
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="page-container">
            <Header onRefresh={handleRefresh} isRefreshing={isRefreshing} />
            <div className="main-content-area">
                {renderContent()}
            </div>
        </div>
    );
}

export default TeamManagementPage;
