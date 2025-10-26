import React from 'react';

const Budget = () => {
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
        <button className="btn" id="addExp">➕ 添加</button>
        <button className="btn warn" id="clearExp">🗑️ 清空</button>
      </div>
      <div style={{ marginTop: '12px' }}>
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="pill"><small>预算总额</small><strong id="budgetTotal" style={{ marginLeft: '6px' }}>0</strong></div>
          <div className="pill"><small>已花费</small><strong id="spentTotal" style={{ marginLeft: '6px' }}>0</strong></div>
          <div className="pill"><small>剩余</small><strong id="remainTotal" style={{ marginLeft: '6px' }}>0</strong></div>
        </div>
        <div className="progress" style={{ marginTop: '10px' }}><div id="spentBar" style={{ width: '0%' }}></div></div>
      </div>
      <div className="list" id="expList"></div>
      <div className="footer-note">注：这里的预算上限与「智能行程规划」中的预算联动（同一浏览会话）。</div>
    </section>
  );
};

export default Budget;