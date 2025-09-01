// src/components/Clock.jsx
import React, { useState, useEffect } from 'react';
import './Clock.css';

// 숫자를 두 자리 문자열로 만들어주는 함수 (예: 7 -> "07")
const padZero = (num) => num.toString().padStart(2, '0');

function Clock({ endTime }) {
    // ✅ 1. state에 seconds 추가
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const intervalId = setInterval(() => {
            const targetDate = new Date(endTime);
            const now = new Date();
            const difference = targetDate - now;

            if (difference > 0) {
                const totalSeconds = Math.floor(difference / 1000);
                
                // ✅ 2. 초(seconds) 계산 로직 추가
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;

                // ✅ 3. state 업데이트 시 seconds 포함
                setTimeLeft({ hours, minutes, seconds });
            } else {
                // ✅ 4. 시간이 다 되었을 때도 seconds를 0으로 설정
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                clearInterval(intervalId);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [endTime]);

    return (
        <div className="clock-wrapper">
            <span className="clock-time">
                {/* ✅ 5. 렌더링 부분에 초를 표시하는 span 추가 */}
                {padZero(timeLeft.hours)}:{padZero(timeLeft.minutes)}
                <span className="clock-seconds">.{padZero(timeLeft.seconds)}</span>
            </span>
        </div>
    );
}

export default Clock;