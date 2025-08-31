import React, { useState, useEffect } from 'react';
import '/src/components/AddItemModal.css';

function AddItemModal({ isOpen, onClose, onSubmit, title }) {
    const [inputValue, setInputValue] = useState('');

    // 모달이 열릴 때 input에 포커스를 줍니다.
    useEffect(() => {
        if (isOpen) {
            // setTimeout을 사용하여 모달이 렌더링 된 후 포커스를 줍니다.
            setTimeout(() => {
                const inputElement = document.querySelector('.add-item-form input');
                if (inputElement) {
                    inputElement.focus();
                }
            }, 0);
        }
    }, [isOpen]);


    if (!isOpen) {
        return null;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) {
            alert('값을 입력해주세요.');
            return;
        }
        onSubmit(inputValue);
        setInputValue(''); // 제출 후 입력 필드 초기화
    };

    const handleClose = () => {
        setInputValue(''); // 닫을 때 입력 필드 초기화
        onClose();
    }

    return (
        <div className="modal-backdrop" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>{title}</h3>
                <form onSubmit={handleSubmit} className="add-item-form">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="새 항목 이름 입력"
                    />
                    <div className="modal-buttons">
                        <button type="button" onClick={handleClose} className="cancel-button">취소</button>
                        <button type="submit" className="submit-button">추가</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddItemModal;

