import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Account = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [plans, setPlans] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // 初始化：从 localStorage 读取令牌并设置 axios 默认头
  useEffect(() => {
    const saved = localStorage.getItem('token');
    if (saved) {
      setToken(saved);
      setIsLoggedIn(true);
      axios.defaults.headers.common['Authorization'] = `Bearer ${saved}`;
    }
  }, []);

  // 登录后拉取个人资料
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) return;
      try {
        setLoadingProfile(true);
        const { data } = await axios.get('/api/me');
        // 修复: 后端返回 { user }, 这里绑定为实际用户对象，避免 profile 字段为 null
        setProfile(data?.user || null);
      } catch (err) {
        console.error('加载个人信息失败:', err?.response?.data || err.message);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchMe();
  }, [token]);

  const handleLogout = () => {
    setToken(null);
    setIsLoggedIn(false);
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
    setProfile(null);
    // 刷新以回到登录页并重置入口状态
    window.location.reload();
  };

  // 保存当前行程到云端
  const saveCurrentPlanToCloud = async () => {
    if (!token) return alert('请先登录');
    const inputs = {
      dest: document.getElementById('dest')?.value || '',
      date: document.getElementById('date')?.value || '',
      days: Number(document.getElementById('days')?.value || 0),
      budget: Number(document.getElementById('budget')?.value || 0),
      people: Number(document.getElementById('people')?.value || 0),
      prefs: document.getElementById('prefs')?.value || '',
    };
    const planMarkdown = document.querySelector('#planResult')?.textContent || '';
    const expenses = []; // 目前前端预算未接入状态管理，先空数组占位

    try {
      await axios.post('/api/plans', { inputs, expenses, planMarkdown });
      alert('已保存到云端');
    } catch (error) {
      console.error('保存计划失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  // 载入我的计划
  const loadMyPlansFromCloud = async () => {
    if (!token) return alert('请先登录');
    try {
      const { data } = await axios.get('/api/plans');
      setPlans(data.plans || []);
    } catch (error) {
      console.error('载入计划失败:', error);
      alert('载入失败，请稍后重试');
    }
  };

  const deletePlan = async (id) => {
    if (!token) return alert('请先登录');
    try {
      await axios.delete(`/api/plans/${id}`);
      setPlans(plans.filter((pl) => pl._id !== id));
    } catch (error) {
      console.error('删除计划失败:', error);
      alert('删除失败，请稍后重试');
    }
  };

  return (
    <section className="card" id="panel-account">
      <h2>3) 用户管理与数据存储</h2>

      {/* 登录状态与登出，仅作为账户区展示，登录由入口页负责 */}
      <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
        <span className="badge" id="authState">{isLoggedIn ? '已登录' : '未登录'}</span>
        {isLoggedIn ? (
          <button className="btn" onClick={handleLogout}>🚪 退出登录</button>
        ) : (
          <span className="hint">请先在登录页完成登录后使用此页面。</span>
        )}
      </div>

      {/* 个人信息卡片 */}
      {isLoggedIn && (
        <div style={{ marginTop: '12px' }}>
          {loadingProfile && <p className="hint">正在加载你的资料...</p>}
          {profile && (
            <div className="card" style={{ padding: '12px', background: 'rgba(18,23,51,0.6)' }}>
              <h3 style={{ marginTop: 0 }}>个人信息</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                <div style={{ display: 'grid', placeItems: 'center' }}>
                  <div style={{ width: 90, height: 90, borderRadius: 12, background: 'linear-gradient(135deg,#2a366e,#8593c3)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 32 }}>
                    {profile.displayName?.[0] || profile.username?.[0] || 'U'}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '6px' }}>
                  <div>
                    <span className="hint">用户名</span>
                    <div>{profile.username}</div>
                  </div>
                  {profile.displayName && (
                    <div>
                      <span className="hint">昵称</span>
                      <div>{profile.displayName}</div>
                    </div>
                  )}
                  {profile._id && (
                    <div>
                      <span className="hint">用户ID</span>
                      <div style={{ fontFamily: 'monospace' }}>{profile._id}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #2a366e', margin: '14px 0' }} />

      <div className="row">
        <button className="btn ok" id="savePlanBtn" onClick={saveCurrentPlanToCloud} disabled={!isLoggedIn}>💾 保存当前行程+预算</button>
        <button className="btn" id="loadPlansBtn" onClick={loadMyPlansFromCloud} disabled={!isLoggedIn}>📂 载入我的计划</button>
      </div>

      <div className="list" id="plansList" style={{ marginTop: '10px' }}>
        {plans.length === 0 ? (
          <div className="hint">暂无保存的计划。</div>
        ) : (
          plans.map((p) => (
            <div key={p._id} className="item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>计划</strong>
                <div className="hint">{p.inputs?.dest || '未定'} · {p.inputs?.days || '-'} 天 · 预算 ¥{p.inputs?.budget || 0}</div>
              </div>
              <div>
                <button className="btn" onClick={() => deletePlan(p._id)}>🗑️ 删除</button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Account;