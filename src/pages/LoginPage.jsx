import React, { useState, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/axios';
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const fromQuery = new URLSearchParams(location.search).get('from');
  const safeFrom =
    fromQuery && fromQuery.startsWith('/') && !fromQuery.startsWith('//')
      ? fromQuery
      : null;
  const from = safeFrom || location.state?.from?.pathname || '/admin';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = { username, password };
      const response = await apiClient.post('/admin/login', payload);
      login(response.data);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('로그인 실패:', err);
      if (err.response?.status === 428) {
        setNeedsSetup(true);
        setError('');
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/admin/setup-password', {
        userName: username,
        newPassword,
      });
      login(response.data);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('비밀번호 설정 실패:', err);
      setError(err.response?.data?.message || '비밀번호 설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (needsSetup) {
    return (
      <div className="login-container">
        <div className="login-card">
          <Link to="/" className="login-title-link">
            <h2>HNN</h2>
          </Link>
          <p>처음 로그인하시네요. 사용할 비밀번호를 설정해주세요.</p>
          <form onSubmit={handleSetupPassword}>
            <div className="form-group">
              <label htmlFor="new-password">새 비밀번호</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-password">비밀번호 확인</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? '설정 중...' : '비밀번호 설정'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <Link to="/" className="login-title-link">
          <h2>HNN</h2>
        </Link>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
