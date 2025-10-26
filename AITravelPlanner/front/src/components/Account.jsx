import React, { useState } from 'react';
import axios from 'axios';

const Account = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);

  const handleRegister = async () => {
    const username = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      await axios.post('http://localhost:3000/api/register', { username, password });
      alert('Registration successful! Please log in.');
    } catch (error) {
      console.error('Error registering:', error);
      alert('Registration failed.');
    }
  };

  const handleLogin = async () => {
    const username = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const response = await axios.post('http://localhost:3000/api/login', { username, password });
      setToken(response.data.token);
      setIsLoggedIn(true);
      alert('Login successful!');
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Login failed.');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setIsLoggedIn(false);
  };

  return (
    <section className="card" id="panel-account">
      <h2>3) 用户管理与数据存储</h2>
      <div className="row">
        <div style={{ flex: '1 1 220px' }}>
          <label>邮箱</label>
          <input id="email" placeholder="you@example.com" />
        </div>
        <div style={{ flex: '1 1 180px' }}>
          <label>密码</label>
          <input type="password" id="password" />
        </div>
      </div>
      <div className="row" style={{ marginTop: '10px' }}>
        <button className="btn" id="registerBtn" onClick={handleRegister}>📝 注册</button>
        <button className="btn" id="loginBtn" onClick={handleLogin}>🔐 登录</button>
        <button className="btn" id="logoutBtn" onClick={handleLogout}>🚪 退出</button>
        <span className="badge" id="authState">{isLoggedIn ? '已登录' : '未登录'}</span>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid #2a366e', margin: '14px 0' }} />
      <div className="row">
        <button className="btn ok" id="savePlanBtn">💾 保存当前行程+预算</button>
        <button className="btn" id="loadPlansBtn">📂 载入我的计划</button>
      </div>
      <div className="list" id="plansList" style={{ marginTop: '10px' }}></div>
    </section>
  );
};

export default Account;