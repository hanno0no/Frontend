// src/components/StatusCard.jsx
import React from 'react';
import './StatusCard.css';

function StatusCard({ title, items }) {
    return (
        <div className="status-card">
            <h2 className="card-title">{title}</h2>
            <ul className="status-list">
                {/* 이제 item이 바로 문자열이므로 그대로 출력합니다. */}
                {items.map((item, index) => (
                    <li key={index} className="status-item">
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default StatusCard;