import React, { useState, useEffect } from 'react';
import './style.css';
import Tabs from './components/Tabs';
import Plan from './components/Plan';
import Budget from './components/Budget';
import Account from './components/Account';
import axios from 'axios';
import Auth from './pages/Auth';

function App() {
  const [activeTab, setActiveTab] = useState('plan');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const tok = localStorage.getItem('token');
    if (tok) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`;
      setIsLoggedIn(true);
    }
  }, []);

  const handleLoginSuccess = (tok) => {
    // token 已由 Auth 页写入 localStorage 与 axios header
    setIsLoggedIn(true);
  };

  return (
    !isLoggedIn ? (
      <div className="App">
        <main>
          <Auth onLoginSuccess={handleLoginSuccess} />
        </main>
      </div>
    ) : (
      <div className="App">
        <header>
          <div className="container">
            <div className="brand">
              <div className="logo"></div>
              <div>
                <h1>AI 旅行规划师</h1>
                <div className="hint">语音输入 · 行程生成 · 预算记录 · 账户/本地存储（模拟云同步）</div>
              </div>
            </div>
            <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </header>
        <main>
          <div className="grid">
            {activeTab === 'plan' && <Plan />}
            {activeTab === 'budget' && <Budget />}
            {activeTab === 'account' && <Account />}
          </div>
        </main>
      </div>
    )
  );
}

export default App;