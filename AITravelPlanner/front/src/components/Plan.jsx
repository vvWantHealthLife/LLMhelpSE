import React, { useState } from 'react';
import axios from 'axios';

const Plan = () => {
  const [plan, setPlan] = useState(null);

  const generatePlan = async () => {
    const destination = document.getElementById('dest').value;
    const duration = document.getElementById('days').value;
    const interests = document.getElementById('prefs').value;

    try {
      const response = await axios.post('http://localhost:3000/api/plan', {
        destination,
        duration,
        interests,
      });
      setPlan(response.data.plan);
    } catch (error) {
      console.error('Error generating plan:', error);
    }
  };

  return (
    <section className="card" id="panel-plan">
      <h2>1) 智能行程规划</h2>
      <div className="row">
        <div style={{ flex: '1 1 240px' }}>
          <label>自然语言需求（可语音）</label>
          <textarea id="nlpText" placeholder="例如：我想去日本，5天，预算1万元，喜欢美食和动漫，带孩子"></textarea>
          <div className="row" style={{ marginTop: '8px' }}>
            <button className="btn" id="micBtn">🎤 开始语音</button>
            <span className="hint" id="sttHint">您的浏览器需支持 Web Speech API（建议 Chrome/Edge）。</span>
          </div>
        </div>
      </div>
      <div className="row" style={{ marginTop: '12px' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label>目的地</label>
          <input id="dest" placeholder="如：日本东京" />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label>出发日期</label>
          <input type="date" id="date" />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label>天数</label>
          <input type="number" id="days" min="1" defaultValue="5" />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label>预算（¥）</label>
          <input type="number" id="budget" min="0" step="100" placeholder="10000" />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <label>同行人数</label>
          <input type="number" id="people" min="1" defaultValue="2" />
        </div>
      </div>
      <div className="row" style={{ marginTop: '12px' }}>
        <div style={{ flex: '1 1 100%' }}>
          <label>旅行偏好（以逗号分隔）</label>
          <input id="prefs" placeholder="美食, 动漫, 亲子, 自然风光" />
        </div>
      </div>
      <div className="row" style={{ marginTop: '12px' }}>
        <button className="btn ghost" id="parseBtn">🔎 从自然语言中提取并填充</button>
        <button className="btn primary" id="genBtn" onClick={generatePlan}>✨ 生成行程</button>
      </div>
      <div style={{ marginTop: '14px' }}>
        <div className="result" id="planResult">
          {plan ? (
            <pre>{plan}</pre>
          ) : (
            <span className="hint">生成的行程会显示在这里。</span>
          )}
        </div>
      </div>
    </section>
  );
};

export default Plan;