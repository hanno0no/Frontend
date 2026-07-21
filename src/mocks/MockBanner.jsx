import './MockBanner.css';
import { isMockMode } from './isMock.js';

function MockBanner() {
  if (!isMockMode) return null;

  return (
    <div className="mock-banner" role="status">
      MOCK MODE — 백엔드 없이 샘플 데이터로 표시 중
    </div>
  );
}

export default MockBanner;
