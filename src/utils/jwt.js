/** JWT payload를 검증 없이 디코딩한다 (표시 목적 전용, 서버가 이미 서명을 검증함). */
export function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** JWT의 subject(사용자명)를 추출한다. 실패 시 null. */
export function getUsernameFromToken(token) {
  return decodeJwtPayload(token)?.sub ?? null;
}
