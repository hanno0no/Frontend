import React, { useState, useEffect } from 'react';
import '/src/components/AddEventModal.css';

function AddEventModal({ isOpen, onClose, onSubmit }) {
    const [eventData, setEventData] = useState({
        eventName: '',
        description: '',
        startTime: '',
        endTime: '',
        open: false,
    });

    // 모달이 닫힐 때 상태를 초기화합니다.
    useEffect(() => {
        if (!isOpen) {
            setEventData({
                eventName: '',
                description: '',
                startTime: '',
                endTime: '',
                open: false,
            });
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEventData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!eventData.eventName.trim()) {
            alert('대회 이름을 입력해주세요.');
            return;
        }
        // 날짜 형식을 서버 요구사항에 맞게 변환 (YYYY-MM-DDTHH:mm:ss)
        const payload = {
            ...eventData,
            startTime: eventData.startTime ? new Date(eventData.startTime).toISOString().slice(0, 19) : null,
            endTime: eventData.endTime ? new Date(eventData.endTime).toISOString().slice(0, 19) : null,
        };
        onSubmit(payload);
    };


    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>새 대회 추가</h3>
                <form onSubmit={handleSubmit} className="add-event-form">
                    <div className="form-group">
                        <label>대회 이름</label>
                        <input
                            type="text"
                            name="eventName"
                            value={eventData.eventName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>설명</label>
                        <textarea
                            name="description"
                            value={eventData.description}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>시작 시간</label>
                        <input
                            type="datetime-local"
                            name="startTime"
                            value={eventData.startTime}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>종료 시간</label>
                        <input
                            type="datetime-local"
                            name="endTime"
                            value={eventData.endTime}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="checkbox-group modal-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                name="open"
                                checked={eventData.open}
                                onChange={handleChange}
                            />
                            진행중
                        </label>
                    </div>
                    <div className="modal-buttons">
                        <button type="button" onClick={onClose} className="cancel-button">취소</button>
                        <button type="submit" className="submit-button">추가</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddEventModal;

