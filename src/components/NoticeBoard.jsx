// src/components/NoticeBoard.jsx
import React from 'react';
import './NoticeBoard.css';

function NoticeBoard({ messages }) {
    return (
        <div className="notice-board-container">
            <ul>
                {messages.map((msg) => (
                    <li key={msg}>{msg}</li>
                ))}
            </ul>
        </div>
    );
}

export default NoticeBoard;