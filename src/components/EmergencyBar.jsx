// src/components/EmergencyBar.jsx
import React from 'react';
import './EmergencyBar.css';

function EmergencyBar({ messages }) {
    return (
        <div className="emergency-bar">
            {/* 여러 개의 긴급 메시지를 하나의 문자열로 합쳐서 보여줍니다. */}
            <p>{messages.join(' / ')}</p>
        </div>
    );
}

export default EmergencyBar;