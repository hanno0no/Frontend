import React from 'react';
import { getStatusLabel, getTeamStatusStyle } from '../constants/status';

/** 팀별 조회 페이지용 상태 배지: "출력 완료(픽업 가능)"만 강조 표시 */
function StatusBadge({ status }) {
    return <span className={getTeamStatusStyle(status)}>{getStatusLabel(status)}</span>;
}

export default StatusBadge;
