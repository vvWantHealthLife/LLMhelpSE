import React, { useState } from 'react';
import MapRoute from './MapRoute';

const RoutePanel = () => {
  const [originAddr, setOriginAddr] = useState('');
  const [destAddr, setDestAddr] = useState('');
  const [routeSummary, setRouteSummary] = useState(null);

  return (
    <section className="card" id="panel-route">
      <h2>🚗 导航与地图（高德）</h2>
      <div className="row" style={{ marginTop: '8px' }}>
        <div style={{ flex: '1 1 50%' }}>
          <label>起点地址</label>
          <input id="originAddr" value={originAddr} onChange={(e) => setOriginAddr(e.target.value)} placeholder="如：北京市朝阳区国贸" />
        </div>
        <div style={{ flex: '1 1 50%' }}>
          <label>终点地址</label>
          <input id="destAddr" value={destAddr} onChange={(e) => setDestAddr(e.target.value)} placeholder="如：北京市海淀区中关村" />
        </div>
      </div>
      <div className="row" style={{ marginTop: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          {routeSummary ? (
            <div className="pill">
              <small>预估时间</small>
              <strong style={{ marginLeft: 6 }}>{Math.round(routeSummary.duration_s / 60)} 分钟</strong>
              <small style={{ marginLeft: 12 }}>距离</small>
              <strong style={{ marginLeft: 6 }}>{(routeSummary.distance_m / 1000).toFixed(1)} 公里</strong>
            </div>
          ) : (
            <span className="hint">输入起点与终点后自动计算驾车路线并展示地图</span>
          )}
        </div>
      </div>
      {originAddr && destAddr && (
        <div style={{ marginTop: '10px' }}>
          <MapRoute originAddress={originAddr} destAddress={destAddr} onSummary={setRouteSummary} />
        </div>
      )}
    </section>
  );
};

export default RoutePanel;