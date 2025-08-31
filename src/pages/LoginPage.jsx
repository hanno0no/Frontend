import React, { useState, useContext } from 'react';
// Link를 react-router-dom에서 import 합니다.
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/axios';
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        username: username,
        password: password
      };
      
      const response = await apiClient.post('/admin/login', payload);
      
      login(response.data);
      
      navigate(from, { replace: true });

    } catch (err) {
      console.error('로그인 실패:', err);
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* ✅ h2 태그를 Link 컴포넌트로 감싸줍니다. */}
        {/* to="/"는 메인 페이지(DashboardPage)로 이동하라는 의미입니다. */}
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
