import React, { useEffect, useState } from 'react';

const Budget = () => {
  const [expenses, setExpenses] = useState([]);
  const [totals, setTotals] = useState({ budgetTotal: 0, spent: 0, remain: 0, percent: 0 });
  const [advice, setAdvice] = useState('');
  const EXPENSES_KEY = 'atp_expenses';

  const computeTotals = (list) => {
    // 从共享存储读取预算上限（跨标签页），优先 window.__budget，其次 localStorage
    const budgetTotal = (typeof window !== 'undefined' && window.__budget && typeof window.__budget.budgetTotal === 'number')
      ? Number(window.__budget.budgetTotal)
      : Number((typeof localStorage !== 'undefined' && localStorage.getItem('atp_budget_total')) || 0);
    const spent = list.reduce((sum, e) => sum + (Number(e.amt) || 0), 0);
    const remain = Math.max(0, budgetTotal - spent);
    const percent = budgetTotal ? Math.round((spent / budgetTotal) * 100) : 0;
    const next = { budgetTotal, spent, remain, percent };
    setTotals(next);
    // 暴露给账户页用于云保存
    window.__budget = { expenses: list, budgetTotal };
  };

  useEffect(() => {
    computeTotals(expenses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 初次挂载时从 localStorage 回填预算项列表
  useEffect(() => {
    try {
      const raw = typeof localStorage !== 'undefined' && localStorage.getItem(EXPENSES_KEY);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          setExpenses(list);
          computeTotals(list);
        }
      }
    } catch (_) {}
  }, []);

  // 初次挂载时从 localStorage 回填预算值（Plan 标签未挂载时也能获取）
  useEffect(() => {
    const initial = Number((typeof localStorage !== 'undefined' && localStorage.getItem('atp_budget_total')) || (window.__budget?.budgetTotal ?? 0));
    setTotals((prev) => {
      const remain = Math.max(0, initial - prev.spent);
      const percent = initial ? Math.round((prev.spent / initial) * 100) : 0;
      return { ...prev, budgetTotal: initial, remain, percent };
    });
  }, []);

  // 监听来自 Plan.jsx 的自定义事件，随时更新预算上限
  useEffect(() => {
    const handler = (e) => {
      const val = Number(e.detail || 0);
      setTotals((prev) => {
        const remain = Math.max(0, val - prev.spent);
        const percent = val ? Math.round((prev.spent / val) * 100) : 0;
        return { ...prev, budgetTotal: val, remain, percent };
      });
      try {
        window.__budget = { expenses, budgetTotal: val };
      } catch (_) {}
    };
    window.addEventListener('atp:budgetUpdated', handler);
    return () => window.removeEventListener('atp:budgetUpdated', handler);
    // 当 expenses 改变时，保持共享对象中的支出列表最新
  }, [expenses]);

  // 监听重新生成行程时的费用重置事件
  useEffect(() => {
    const resetHandler = () => {
      setExpenses([]);
      computeTotals([]);
      try { if (typeof localStorage !== 'undefined') localStorage.setItem(EXPENSES_KEY, JSON.stringify([])); } catch (_) {}
      setAdvice('');
    };
    window.addEventListener('atp:expensesReset', resetHandler);
    return () => window.removeEventListener('atp:expensesReset', resetHandler);
  }, []);

  const addExpense = () => {
    const nameEl = document.getElementById('expName');
    const amtEl = document.getElementById('expAmt');
    const catEl = document.getElementById('expCat');
    const name = String(nameEl?.value || '').trim();
    const amt = Number(amtEl?.value || 0);
    const cat = String(catEl?.value || '其他');
    if (!name || !amt) {
      alert('请填写项目与金额');
      return;
    }
    const next = [...expenses, { name, amt, cat }];
    setExpenses(next);
    computeTotals(next);
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(EXPENSES_KEY, JSON.stringify(next)); } catch (_) {}
    nameEl && (nameEl.value = '');
    amtEl && (amtEl.value = '');
  };

  const clearExpenses = () => {
    setExpenses([]);
    computeTotals([]);
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(EXPENSES_KEY, JSON.stringify([])); } catch (_) {}
    setAdvice('');
  };

  const analyzeBudget = async () => {
    try {
      // fetch 返回的就是解析后的 JSON 对象，不包含 axios 风格的 data 包裹
      const data = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expenses, budgetTotal: totals.budgetTotal, currency: 'CNY' }),
      }).then(r => r.json());
      if (data?.advice || data?.summary) {
        // 兼容不同返回结构
        const adv = data?.advice || '';
        const sum = data?.summary || {};
        setAdvice(adv || advice);
        // 若服务端有更准确的百分比/合计，则刷新展示
        if (typeof sum.spent === 'number') {
          setTotals({
            budgetTotal: Number(sum.budgetTotal || totals.budgetTotal),
            spent: Number(sum.spent || totals.spent),
            remain: Number(sum.remain || totals.remain),
            percent: Number(sum.percent || totals.percent),
          });
        }
      } else if (data?.ok) {
        setAdvice(data?.advice || '');
        const sum = data?.summary || {};
        setTotals({
          budgetTotal: Number(sum.budgetTotal || totals.budgetTotal),
          spent: Number(sum.spent || totals.spent),
          remain: Number(sum.remain || totals.remain),
          percent: Number(sum.percent || totals.percent),
        });
      } else {
        setAdvice('分析失败，请稍后重试');
      }
    } catch (e) {
      console.error('预算分析失败:', e);
      setAdvice('分析失败，请稍后重试');
    }
  };

  return (
    <section className="card" id="panel-budget">
      <h2>2) 费用预算与管理</h2>
      <div className="row">
        <div style={{ flex: '1 1 160px' }}>
          <label>项目</label>
          <input id="expName" placeholder="如：机场到市区打车" />
        </div>
        <div style={{ flex: '1 1 120px' }}>
          <label>金额（¥）</label>
          <input type="number" id="expAmt" min="0" step="1" />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label>类别</label>
          <select id="expCat">
            <option>交通</option>
            <option>住宿</option>
            <option>餐饮</option>
            <option>门票/活动</option>
            <option>购物</option>
            <option>其他</option>
          </select>
        </div>
      </div>
      <div className="row" style={{ marginTop: '10px' }}>
        <button className="btn" id="addExp" onClick={addExpense}>➕ 添加</button>
        <button className="btn warn" id="clearExp" onClick={clearExpenses}>🗑️ 清空</button>
        <button className="btn" onClick={analyzeBudget}>🧠 分析预算</button>
      </div>
      <div style={{ marginTop: '12px' }}>
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="pill"><small>预算总额</small><strong id="budgetTotal" style={{ marginLeft: '6px' }}>{totals.budgetTotal}</strong></div>
          <div className="pill"><small>已花费</small><strong id="spentTotal" style={{ marginLeft: '6px' }}>{totals.spent}</strong></div>
          <div className="pill"><small>剩余</small><strong id="remainTotal" style={{ marginLeft: '6px' }}>{totals.remain}</strong></div>
        </div>
        <div className="progress" style={{ marginTop: '10px' }}><div id="spentBar" style={{ width: `${Math.min(100, totals.percent)}%` }}></div></div>
      </div>
      <div className="list" id="expList">
        {expenses.length === 0 ? (
          <div className="hint">暂无预算项，先添加几条试试。</div>
        ) : (
          expenses.map((e, idx) => (
            <div key={idx} className="item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{e.name}</strong>
                <div className="hint">{e.cat} · ¥{e.amt}</div>
              </div>
              <div>
                <button className="btn" onClick={() => { const next = expenses.filter((_, i) => i !== idx); setExpenses(next); computeTotals(next); try { if (typeof localStorage !== 'undefined') localStorage.setItem(EXPENSES_KEY, JSON.stringify(next)); } catch (_) {} }}>删除</button>
              </div>
            </div>
          ))
        )}
      </div>
      {!!advice && (
        <div className="card" style={{ marginTop: 10 }}>
          <h3 style={{ marginTop: 0 }}>预算建议</h3>
          <div className="hint" style={{ whiteSpace: 'pre-wrap' }}>{advice}</div>
        </div>
      )}
      <div className="footer-note">注：这里的预算上限与「智能行程规划」中的预算联动（同一浏览会话）。</div>
    </section>
  );
};

export default Budget;