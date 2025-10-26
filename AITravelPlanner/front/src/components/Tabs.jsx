import React from 'react';

const Tabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="tabs">
      <button className={`tab ${activeTab === 'plan' ? 'active' : ''}`} onClick={() => setActiveTab('plan')}>
        智能行程规划
      </button>
      <button className={`tab ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>
        费用预算与管理
      </button>
      <button className={`tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
        用户管理与数据存储
      </button>
    </div>
  );
};

export default Tabs;