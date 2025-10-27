import React, { useState } from 'react';
import axios from 'axios';

export default function Auth({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const switchMode = (next) => {
    setMessage('');
    setMode(next);
  };

  const handleRegister = async () => {
    if (!username || !password) {
      setMessage('请输入用户名和密码');
      return;
    }
    if (!displayName.trim()) {
      setMessage('请输入昵称，便于展示你的个人信息');
      return;
    }
    if (password.length < 6) {
      setMessage('密码长度至少为 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('两次输入的密码不一致');
      return;
    }
    try {
      setLoading(true);
      await axios.post('/api/register', { username, password, displayName });
      setMessage('注册成功，正在自动登录...');
      await handleLogin();
    } catch (err) {
      const msg = err?.response?.data?.error || '注册失败，请稍后再试';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) {
      setMessage('请输入用户名和密码');
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.post('/api/login', { username, password });
      const token = data?.token;
      if (!token) {
        setMessage('登录失败：未返回令牌');
        return;
      }
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setMessage('登录成功！');
      if (typeof onLoginSuccess === 'function') onLoginSuccess(token);
    } catch (err) {
      const msg = err?.response?.data?.error || '登录失败，请稍后再试';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap" style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
      <div className="card auth-card" style={{ width: 540, padding: 26, borderRadius: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div className="logo"></div>
          <div>
            <h2 style={{ margin: 0 }}>AI 旅行规划师</h2>
            <p className="muted" style={{ marginTop: 4 }}>登录后可使用行程规划、预算记录与云端同步</p>
          </div>
        </div>

        <div className="auth-toggle" style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
          <button className={`btn ${mode === 'login' ? 'primary' : ''}`} onClick={() => switchMode('login')}>登录</button>
          <button className={`btn ${mode === 'register' ? 'primary' : ''}`} onClick={() => switchMode('register')}>注册</button>
        </div>

        <div className="auth-form" style={{ display: 'grid', gap: 12 }}>
          <label className="input">
            <span>用户名</span>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" />
          </label>
          {mode === 'register' && (
            <label className="input">
              <span>昵称</span>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="展示用昵称，如“王小明”" />
            </label>
          )}
          <label className="input">
            <span>密码</span>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" style={{ paddingRight: 40 }} />
              <button type="button" aria-label="显示/隐藏密码" onClick={() => setShowPassword((v) => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--sub)' }}>{showPassword ? '🙈' : '👁️'}</button>
            </div>
          </label>

          {mode === 'register' && (
            <label className="input">
              <span>确认密码</span>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="请再次输入密码" style={{ paddingRight: 40 }} />
                <button type="button" aria-label="显示/隐藏确认密码" onClick={() => setShowConfirm((v) => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--sub)' }}>{showConfirm ? '🙈' : '👁️'}</button>
              </div>
            </label>
          )}

          {message && <div className="muted">{message}</div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {mode === 'login' ? (
              <button className="btn primary" onClick={handleLogin} disabled={loading}>登录</button>
            ) : (
              <button className="btn primary" onClick={handleRegister} disabled={loading}>注册并登录</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}