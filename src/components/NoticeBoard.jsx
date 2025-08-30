// src/components/NoticeBoard.jsx
import React from 'react';
import './NoticeBoard.css';

function NoticeBoard({ messages }) {
    return (
        <div className="notice-board-container">
            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                ))}
            </ul>
        </div>
    );
}

export default NoticeBoard;