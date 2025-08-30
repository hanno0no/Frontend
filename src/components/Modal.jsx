// src/components/Modal.jsx
import React from 'react';
import './Modal.css';

function Modal({ isOpen, onClose, children }) {
    if (!isOpen) {
        return null; // isOpen이 false이면 아무것도 렌더링하지 않음
    }

    return (
        // 모달의 배경(backdrop)
        <div className="modal-backdrop" onClick={onClose}>
            {/* 모달 컨텐츠 영역 */}
            {/* e.stopPropagation()은 배경 클릭 시 닫히는 이벤트가 컨텐츠까지 전파되는 것을 막습니다. */}
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {children}
                <button onClick={onClose} className="modal-close-button">확인</button>
            </div>
        </div>
    );
}

export default Modal;