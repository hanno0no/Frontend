import React, { useState, useEffect, useCallback, useContext } from 'react';
import apiClient from '../api/axios.js';
import { AuthContext } from '../context/AuthContext';
import './AdminManagementSection.css';

const WORK_AREAS = ['접수', '디자인', '출력', '3D프린트', '기타'];

function AdminManagementSection() {
    const { user } = useContext(AuthContext);
    const myUsername = user?.username;

    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newUserName, setNewUserName] = useState('');
    const [newWorkAreas, setNewWorkAreas] = useState([]);

    const [editingId, setEditingId] = useState(null);
    const [editUserName, setEditUserName] = useState('');
    const [editPassword, setEditPassword] = useState('');
    const [editConfirmPassword, setEditConfirmPassword] = useState('');
    const [editWorkAreas, setEditWorkAreas] = useState([]);

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

    const startEdit = (admin) => {
        setEditingId(admin.adminId);
        setEditUserName(admin.userName);
        setEditPassword('');
        setEditConfirmPassword('');
        setEditWorkAreas(admin.workAreas);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditPassword('');
        setEditConfirmPassword('');
    };

    const handleSaveEdit = async (adminId) => {
        const trimmedPassword = editPassword.trim();
        if (trimmedPassword && trimmedPassword !== editConfirmPassword.trim()) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        const body = { userName: editUserName.trim(), workAreas: editWorkAreas };
        if (trimmedPassword) {
            body.password = trimmedPassword;
        }
        try {
            await apiClient.patch(`/admin/admins/${adminId}`, body);
            setEditingId(null);
            setEditPassword('');
            setEditConfirmPassword('');
            fetchAdmins();
        } catch (err) {
            console.error('관리자 수정 에러:', err.response?.status, err.response?.data?.message);
            alert(err.response?.data?.message || '관리자 수정에 실패했습니다.');
        }
    };

    const handleDelete = async (admin) => {
        const confirmed = window.confirm(
            `${admin.userName} 계정을 삭제하시겠습니까?\n\n` +
            '- 완료/수령/실패 처리된 주문의 담당자 이력은 그대로 유지됩니다.\n' +
            '- 진행중인 주문은 담당자가 미배정 상태로 바뀝니다.\n' +
            '- 삭제된 계정은 관리자 목록에서 언제든 재활성화할 수 있습니다.'
        );
        if (!confirmed) return;
        try {
            await apiClient.delete(`/admin/admins/${admin.adminId}`);
            fetchAdmins();
        } catch (err) {
            console.error('관리자 삭제 에러:', err);
            alert(err.response?.data?.message || '관리자 삭제에 실패했습니다.');
        }
    };

    const handleReactivate = async (admin) => {
        try {
            await apiClient.patch(`/admin/admins/${admin.adminId}/reactivate`);
            fetchAdmins();
        } catch (err) {
            console.error('관리자 재활성화 에러:', err);
            alert(err.response?.data?.message || '관리자 재활성화에 실패했습니다.');
        }
    };

    if (isLoading) return <div>로딩 중...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const activeAdmins = admins.filter((admin) => !admin.deleted);
    const isLastAdmin = activeAdmins.length <= 1;

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
                    ) : admins.map((admin) => {
                        const isEditing = editingId === admin.adminId;
                        const isMe = admin.userName === myUsername;
                        return (
                            <tr key={admin.adminId}>
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="team-phone-input"
                                            value={editUserName}
                                            onChange={(e) => setEditUserName(e.target.value)}
                                        />
                                    ) : admin.userName}
                                </td>
                                <td>
                                    {isEditing ? (
                                        <div className="work-area-checkboxes">
                                            {WORK_AREAS.map((area) => (
                                                <label key={area} className="work-area-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={editWorkAreas.includes(area)}
                                                        onChange={() => toggleWorkArea(editWorkAreas, setEditWorkAreas, area)}
                                                    />
                                                    {area}
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        admin.workAreas.length > 0
                                            ? admin.workAreas.map((area) => (
                                                <span key={area} className="status-badge status-badge--neutral work-area-badge">{area}</span>
                                            ))
                                            : '-'
                                    )}
                                </td>
                                <td>
                                    {admin.deleted && (
                                        <span className="status-badge status-badge--muted">삭제됨</span>
                                    )}
                                    {!admin.deleted && !admin.passwordSet && (
                                        <span className="status-badge status-badge--muted">비밀번호 미설정</span>
                                    )}
                                    {isEditing && isMe && (
                                        <>
                                            <input
                                                type="password"
                                                className="team-phone-input"
                                                value={editPassword}
                                                onChange={(e) => setEditPassword(e.target.value)}
                                                placeholder="변경 시에만 입력"
                                            />
                                            <input
                                                type="password"
                                                className="team-phone-input"
                                                value={editConfirmPassword}
                                                onChange={(e) => setEditConfirmPassword(e.target.value)}
                                                placeholder="비밀번호 확인"
                                            />
                                        </>
                                    )}
                                </td>
                                <td>
                                    <div className="team-row-actions">
                                        {admin.deleted ? (
                                            <button type="button" className="team-action-button" onClick={() => handleReactivate(admin)}>
                                                재활성화
                                            </button>
                                        ) : isEditing ? (
                                            <>
                                                <button type="button" className="team-action-button" onClick={() => handleSaveEdit(admin.adminId)}>저장</button>
                                                <button type="button" className="team-action-button" onClick={cancelEdit}>취소</button>
                                            </>
                                        ) : (
                                            <>
                                                <button type="button" className="team-action-button" onClick={() => startEdit(admin)}>수정</button>
                                                <button
                                                    type="button"
                                                    className="team-action-button team-action-delete"
                                                    disabled={isMe || isLastAdmin}
                                                    title={isMe ? '본인 계정은 삭제할 수 없습니다' : (isLastAdmin ? '마지막 남은 관리자 계정은 삭제할 수 없습니다' : undefined)}
                                                    onClick={() => handleDelete(admin)}
                                                >
                                                    삭제
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

export default AdminManagementSection;
