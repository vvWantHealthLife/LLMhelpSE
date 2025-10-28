import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const Account = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [plans, setPlans] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [expandedIds, setExpandedIds] = useState({});

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
    // 优先读取持久化的表单与自然语言，避免跨标签或刷新后丢失
    let inputs = null;
    try {
      const raw = (typeof localStorage !== 'undefined' && localStorage.getItem('atp_inputs')) || '';
      inputs = raw ? JSON.parse(raw) : null;
    } catch (_) {}
    if (!inputs || typeof inputs !== 'object') {
      inputs = {
        dest: document.getElementById('dest')?.value || '',
        date: document.getElementById('date')?.value || '',
        days: Number(document.getElementById('days')?.value || 0),
        budget: Number(document.getElementById('budget')?.value || 0),
        people: Number(document.getElementById('people')?.value || 0),
        prefs: document.getElementById('prefs')?.value || '',
      };
    }
    // 优先从共享存储/本地存储读取行程内容，避免切换标签导致保存为空
    const planMarkdown =
      (typeof window !== 'undefined' && window.__planMarkdown) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('atp_plan_md')) ||
      (document.querySelector('#planResult')?.textContent || '');
    const nlpText =
      (typeof window !== 'undefined' && window.__nlpText) ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('atp_nlp_text')) || '';
    let expenses = (window.__budget && Array.isArray(window.__budget.expenses)) ? window.__budget.expenses : [];
    if (!Array.isArray(expenses) || expenses.length === 0) {
      try {
        const raw = (typeof localStorage !== 'undefined' && localStorage.getItem('atp_expenses')) || '[]';
        const list = JSON.parse(raw);
        if (Array.isArray(list)) expenses = list;
      } catch (_) {}
    }

    try {
      await axios.post('/api/plans', { inputs, expenses, planMarkdown, nlpText });
      alert('已保存到云端');
      // 保存成功后刷新列表，确保用户能立即看到保存的内容
      await loadMyPlansFromCloud();
    } catch (error) {
      console.error('保存计划失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  // 载入我的计划
  const loadMyPlansFromCloud = async () => {
    if (!token) return alert('请先登录');
    try {
      setLoadingPlans(true);
      const { data } = await axios.get('/api/plans');
      setPlans(data.plans || []);
    } catch (error) {
      console.error('载入计划失败:', error);
      alert('载入失败，请稍后重试');
    } finally {
      setLoadingPlans(false);
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

  // 登录后自动载入已保存的计划，确保前端能看到之前的内容
  useEffect(() => {
    if (isLoggedIn && token) {
      loadMyPlansFromCloud();
    }
  }, [isLoggedIn, token]);

  const toggleExpand = (id) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
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
        {loadingPlans && <div className="hint">正在载入已保存的内容...</div>}
        {plans.length === 0 && !loadingPlans && (
          <div className="hint">暂无保存的计划。</div>
        )}
        {plans.length > 0 && (
          plans.map((p) => (
            <div key={p._id} className="item" style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>去 {(p.inputs?.dest && String(p.inputs.dest).trim()) || '未知地点'} 的计划</strong>
                  <div className="hint">
                    天数 {(typeof p.inputs?.days === 'number' && p.inputs.days > 0) ? p.inputs.days : '-'} 天 · 预算 ¥{Number(p.inputs?.budget || 0)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" onClick={() => toggleExpand(p._id)}>{expandedIds[p._id] ? '🔽 收起' : '🔍 查看'}</button>
                  <button className="btn" onClick={() => deletePlan(p._id)}>🗑️ 删除</button>
                </div>
              </div>
              {expandedIds[p._id] && (
                <div className="card" style={{ background: 'rgba(18,23,51,0.5)', padding: 10 }}>
                  {p.nlpText && (
                    <div style={{ marginBottom: 8 }}>
                      <div className="hint">自然语言需求</div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{p.nlpText}</div>
                    </div>
                  )}
                  {p.planMarkdown ? (
                    <ReactMarkdown>{p.planMarkdown}</ReactMarkdown>
                  ) : (
                    <div className="hint">该计划没有保存具体行程内容。</div>
                  )}
                  {Array.isArray(p.expenses) && p.expenses.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div className="hint">已保存的预算项（{p.expenses.length}）</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {p.expenses.map((e, idx) => (
                          <li key={idx}>{e.name || '未命名'} · ¥{Number((e.amt ?? e.cost ?? 0))}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default Account;