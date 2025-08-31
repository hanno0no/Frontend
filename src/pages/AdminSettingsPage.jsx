import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/axios.js';
import Header from '../components/Header.jsx';
import AddItemModal from '../components/AddItemModal.jsx';
import AddEventModal from '../components/AddEventModal.jsx'; // ✅ Event 전용 모달 import
import './AdminSettingsPage.css';


function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        eventInfos: [],
        messages: [],
        materials: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('events');

    // 모달 상태 관리
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false); // ✅ Event 모달 상태
    const [modalContext, setModalContext] = useState({ category: '', title: '' });


    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/admin/setting');
            setSettings(response.data);
        } catch (err) {
            console.error("설정 정보 조회 에러:", err);
            setError("설정 정보를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleInputChange = (category, index, field, value) => {
        const newSettings = { ...settings };
        const finalValue = typeof newSettings[category][index][field] === 'boolean' ? (value === 'true' || value === true) : value;
        newSettings[category][index][field] = finalValue;
        setSettings(newSettings);
    };

    const handleSaveChanges = async () => {
        try {
            const payload = {
                eventInfoRequestDtos: settings.eventInfos.map(e => ({
                    eventId: e.eventId,
                    eventName: e.eventName,
                    description: e.description,
                    startTime: e.startTime,
                    endTime: e.endTime,
                    isOpen: e.open
                })),
                messageRequestDtos: settings.messages.map(m => ({
                    messageId: m.messageId,
                    content: m.content,
                    isDisplay: m.display,
                    isEmergency: m.emergency
                })),
                materialRequestDtos: settings.materials.map(m => ({
                    materialId: m.materialId,
                    materialName: m.materialName,
                    isActive: m.active
                }))
            };
            await apiClient.patch('/admin/setting', payload);
            alert('설정이 성공적으로 저장되었습니다.');
        } catch (err) {
            console.error("설정 저장 에러:", err);
            alert('설정 저장에 실패했습니다.');
        }
    };

    const handleAddButtonClick = (category) => {
        if (category === 'eventInfos') {
            setIsEventModalOpen(true); // ✅ Event 모달 열기
        } else {
            let title = '';
            if (category === 'messages') title = '새 메시지 추가';
            if (category === 'materials') title = '새 재질 추가';
            setModalContext({ category, title });
            setIsItemModalOpen(true);
        }
    };

    // ✅ 메시지, 재질 추가 핸들러
    const handleAddItemSubmit = async (inputValue) => {
        const { category } = modalContext;
        let endpoint = '';
        let payload = {};

        if (category === 'messages') {
            endpoint = '/admin/create/message';
            payload = { content: inputValue, emergency: false, display: true };
        } else if (category === 'materials') {
            endpoint = '/admin/create/material';
            payload = { materialName: inputValue, active: true };
        }

        if (!endpoint) return;

        try {
            await apiClient.post(endpoint, payload);
            alert('새로운 항목이 추가되었습니다.');
            fetchSettings();
        } catch (err) {
            console.error(`${category} 추가 에러:`, err);
            alert("항목 추가에 실패했습니다.");
        } finally {
            setIsItemModalOpen(false);
        }
    };

    // ✅ 이벤트 추가 핸들러
    const handleAddEventSubmit = async (eventPayload) => {
        try {
            await apiClient.post('/admin/create/eventinfo', eventPayload);
            alert('새로운 대회가 추가되었습니다.');
            fetchSettings();
        } catch (err) {
            console.error("대회 추가 에러:", err);
            alert("대회 추가에 실패했습니다.");
        } finally {
            setIsEventModalOpen(false);
        }
    };


    const renderContent = () => {
        switch (activeTab) {
            case 'events':
                return (
                    <div className="settings-section">
                        <div className="section-header">
                            <h2>대회 정보</h2>
                            <button onClick={() => handleAddButtonClick('eventInfos')} className="add-button">추가</button>
                        </div>
                        {settings.eventInfos.map((event, index) => (
                            <div key={event.eventId} className="settings-item card-style">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>대회 이름</label>
                                        <input type="text" value={event.eventName} onChange={(e) => handleInputChange('eventInfos', index, 'eventName', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>시작 시간</label>
                                        <input type="datetime-local" value={event.startTime ? event.startTime.substring(0, 16) : ''} onChange={(e) => handleInputChange('eventInfos', index, 'startTime', e.target.value + ':00')} />
                                    </div>
                                    <div className="form-group">
                                        <label>종료 시간</label>
                                        <input type="datetime-local" value={event.endTime ? event.endTime.substring(0, 16) : ''} onChange={(e) => handleInputChange('eventInfos', index, 'endTime', e.target.value + ':00')} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>설명</label>
                                        <textarea value={event.description} onChange={(e) => handleInputChange('eventInfos', index, 'description', e.target.value)} />
                                    </div>
                                </div>
                                <div className="checkbox-group">
                                    <label><input type="checkbox" checked={event.open} onChange={(e) => handleInputChange('eventInfos', index, 'open', e.target.checked)} /> 진행중</label>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'messages':
                return (
                    <div className="settings-section">
                        <div className="section-header">
                            <h2>공지 메시지</h2>
                            <button onClick={() => handleAddButtonClick('messages')} className="add-button">추가</button>
                        </div>
                        {settings.messages.map((message, index) => (
                            <div key={message.messageId} className="settings-item card-style">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>내용</label>
                                        <input type="text" value={message.content} onChange={(e) => handleInputChange('messages', index, 'content', e.target.value)} />
                                    </div>
                                </div>
                                <div className="checkbox-group">
                                    <label><input type="checkbox" checked={message.emergency} onChange={(e) => handleInputChange('messages', index, 'emergency', e.target.checked)} /> 긴급</label>
                                    <label><input type="checkbox" checked={message.display} onChange={(e) => handleInputChange('messages', index, 'display', e.target.checked)} /> 표시</label>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'materials':
                return (
                    <div className="settings-section">
                        <div className="section-header">
                            <h2>재질 관리</h2>
                            <button onClick={() => handleAddButtonClick('materials')} className="add-button">추가</button>
                        </div>
                        {settings.materials.map((material, index) => (
                            <div key={material.materialId} className="settings-item card-style">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>재질 이름</label>
                                        <input type="text" value={material.materialName} onChange={(e) => handleInputChange('materials', index, 'materialName', e.target.value)} />
                                    </div>
                                </div>
                                <div className="checkbox-group">
                                    <label><input type="checkbox" checked={material.active} onChange={(e) => handleInputChange('materials', index, 'active', e.target.checked)} /> 활성</label>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            default:
                return null;
        }
    };

    if (isLoading) return <div>로딩 중...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="page-container">
            <Header />
            <div className="action-buttons">
                <Link to="/admin" className="admin-button">HOME</Link>
            </div>
            <div className="main-content-area">
                <div className="settings-page-layout">
                    <div className="settings-sidebar">
                        <button onClick={() => setActiveTab('events')} className={activeTab === 'events' ? 'active' : ''}>대회 정보</button>
                        <button onClick={() => setActiveTab('messages')} className={activeTab === 'messages' ? 'active' : ''}>공지 메시지</button>
                        <button onClick={() => setActiveTab('materials')} className={activeTab === 'materials' ? 'active' : ''}>재질 관리</button>
                    </div>
                    <div className="settings-content">
                        {renderContent()}
                        <button onClick={handleSaveChanges} className="save-button">
                            변경사항 저장
                        </button>
                    </div>
                </div>
            </div>

            <AddItemModal
                isOpen={isItemModalOpen}
                onClose={() => setIsItemModalOpen(false)}
                onSubmit={handleAddItemSubmit}
                title={modalContext.title}
            />
            <AddEventModal
                isOpen={isEventModalOpen}
                onClose={() => setIsEventModalOpen(false)}
                onSubmit={handleAddEventSubmit}
            />
        </div>
    );
}

export default AdminSettingsPage;

