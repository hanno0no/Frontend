// src/components/DashboardQrCard.jsx
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './DashboardQrCard.css';

function DashboardQrCard() {
    const teamLookupUrl = `${window.location.origin}/team-lookup`;

    return (
        <div className="qr-card">
            <p className="qr-card-label">내 접수 조회하기</p>
            <QRCodeSVG value={teamLookupUrl} size={112} className="qr-card-code" />
        </div>
    );
}

export default DashboardQrCard;
