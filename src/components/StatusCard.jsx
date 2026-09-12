// src/components/StatusCard.jsx
import React from 'react';
import './StatusCard.css';

function StatusCard({ title, items, highlightedItems }) {
    return (
        <div className="status-card">
            <h2 className="card-title">{title}</h2>
            <ul className="status-list">
                {/* item(팀번호_접수번호)이 고유하므로 key로 그대로 사용합니다. */}
                {items.map((item) => (
                    <li
                        key={item}
                        className={`status-item${highlightedItems?.has(item) ? ' status-item--new' : ''}`}
                    >
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default StatusCard;