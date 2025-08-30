// src/components/Clock.jsx
import React, { useState, useEffect } from 'react';
import './Clock.css';

// 숫자를 두 자리 문자열로 만들어주는 함수 (예: 7 -> "07")
const padZero = (num) => num.toString().padStart(2, '0');

function Clock({ endTime }) {
    // state의 기본 구조를 hours와 minutes로 변경합니다.
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0 });

    useEffect(() => {
        const intervalId = setInterval(() => {
            const targetDate = new Date(endTime);
            const now = new Date();
            const difference = targetDate - now;

            if (difference > 0) {
                const totalSeconds = Math.floor(difference / 1000);

                // ✅ 계산 로직 변경: 시간과 분을 계산합니다.
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);

                setTimeLeft({ hours, minutes });
            } else {
                setTimeLeft({ hours: 0, minutes: 0 });
                clearInterval(intervalId);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [endTime]);

    return (
        <div className="clock-wrapper">
            <span className="clock-time">
                {/* ✅ 표시되는 부분을 hours와 minutes로 변경합니다. */}
                {padZero(timeLeft.hours)}:{padZero(timeLeft.minutes)}
            </span>
        </div>
    );
}

export default Clock;