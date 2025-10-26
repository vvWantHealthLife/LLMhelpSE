import React, { useState, useEffect } from 'react';
import './style.css';
import Tabs from './components/Tabs';
import Plan from './components/Plan';
import Budget from './components/Budget';
import Account from './components/Account';

function App() {
  const [activeTab, setActiveTab] = useState('plan');

  return (
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
          <aside className="card" id="sideInfo">
            <h2>预览 / 帮助</h2>
            <p className="muted">这是一个 React 实现的前端原型，展示页面结构与交互逻辑。</p>
            <ul>
              <li>语音：使用 <code>Web Speech API</code>（仅演示语音转文字）。</li>
              <li>行程：前端示例生成（非真实 AI 规划）。</li>
              <li>预算：本地列表 + 进度条。</li>
              <li>账户：localStorage 模拟注册/登录与计划保存。</li>
            </ul>
            <p className="footer-note">后端接口与「云端同步」可在将来接入，前端已预留数据结构与事件入口。</p>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;