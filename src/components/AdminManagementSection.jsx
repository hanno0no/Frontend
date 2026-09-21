import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios.js';
import './AdminManagementSection.css';

const WORK_AREAS = ['접수', '디자인', '출력', '기타'];

function AdminManagementSection() {
    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newUserName, setNewUserName] = useState('');
    const [newWorkAreas, setNewWorkAreas] = useState([]);

    const fetchAdmins = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/admin/admins');
            setAdmins(res.data);
            setError(null);
        } catch (err) {
            console.error('관리자 목록 조회 에러:', err);
            if (err.response?.status === 401) return;
            setError('관리자 목록을 불러오는 데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const toggleWorkArea = (areas, setAreas, area) => {
        setAreas(areas.includes(area) ? areas.filter((a) => a !== area) : [...areas, area]);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const userName = newUserName.trim();
        if (!userName) {
            alert('아이디를 입력해주세요.');
            return;
        }
        try {
            await apiClient.post('/admin/signup', { userName, workAreas: newWorkAreas });
            setNewUserName('');
            setNewWorkAreas([]);
            fetchAdmins();
        } catch (err) {
            console.error('관리자 등록 에러:', err);
            alert(err.response?.data?.message || '관리자 등록에 실패했습니다.');
        }
    };

    if (isLoading) return <div>로딩 중...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="admin-management-section">
            <form className="team-create-form" onSubmit={handleCreate}>
                <div className="form-field">
                    <label htmlFor="new-admin-username">아이디</label>
                    <input
                        id="new-admin-username"
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="아이디"
                    />
                </div>
                <div className="form-field">
                    <label>업무 담당 영역</label>
                    <div className="work-area-checkboxes">
                        {WORK_AREAS.map((area) => (
                            <label key={area} className="work-area-checkbox">
                                <input
                                    type="checkbox"
                                    checked={newWorkAreas.includes(area)}
                                    onChange={() => toggleWorkArea(newWorkAreas, setNewWorkAreas, area)}
                                />
                                {area}
                            </label>
                        ))}
                    </div>
                </div>
                <button type="submit" className="team-submit-button">관리자 등록</button>
            </form>

            <table className="team-table">
                <thead>
                    <tr>
                        <th>아이디</th>
                        <th>업무 담당 영역</th>
                        <th>상태</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {admins.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="empty-cell">등록된 관리자가 없습니다.</td>
                        </tr>
                    ) : admins.map((admin) => (
                        <tr key={admin.adminId}>
                            <td>{admin.userName}</td>
                            <td>
                                {admin.workAreas.length > 0
                                    ? admin.workAreas.map((area) => (
                                        <span key={area} className="status-badge status-badge--neutral work-area-badge">{area}</span>
                                    ))
                                    : '-'}
                            </td>
                            <td>
                                {!admin.passwordSet && (
                                    <span className="status-badge status-badge--muted">비밀번호 미설정</span>
                                )}
                            </td>
                            <td></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AdminManagementSection;
