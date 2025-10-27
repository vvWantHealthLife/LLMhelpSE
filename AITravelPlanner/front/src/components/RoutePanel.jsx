import React, { useState } from 'react';
import MapRoute from './MapRoute';

const RoutePanel = () => {
  // 输入框草稿值
  const [draftStart, setDraftStart] = useState('北京天安门');
  const [draftEnd, setDraftEnd] = useState('北京首都国际机场');
  // 确认后用于搜索的值
  const [start, setStart] = useState('北京天安门');
  const [end, setEnd] = useState('北京首都国际机场');
  const [summary, setSummary] = useState(null);

  const confirmSearch = () => {
    if (!draftStart || !draftEnd) {
      setSummary({ error: '请输入起点与终点' });
      return;
    }
    setSummary({ info: '正在查询路线…' });
    setStart(draftStart);
    setEnd(draftEnd);
  };

  return (
    <section className="card" id="panel-route" style={{ marginTop: 16 }}>
      <h2>2) 地图与路线测试（高德）</h2>
      <div className="row" style={{ gap: 12 }}>
        <label className="input" style={{ flex: '1 1 48%' }}>
          <span>起点地址</span>
          <input type="text" value={draftStart} onChange={(e) => setDraftStart(e.target.value)} placeholder="例如：北京天安门" />
        </label>
        <label className="input" style={{ flex: '1 1 48%' }}>
          <span>终点地址</span>
          <input type="text" value={draftEnd} onChange={(e) => setDraftEnd(e.target.value)} placeholder="例如：北京首都国际机场" />
        </label>
      </div>

      <div className="row" style={{ marginTop: 10 }}>
        <div className="hint" style={{ flex: '1 1 auto' }}>
          {summary ? (
            summary.error ? (
              <span>路线规划失败：{summary.error}</span>
            ) : summary?.distanceMeters ? (
              <span>
                距离约 {(summary.distanceMeters / 1000).toFixed(1)} 公里 · 预计 {(summary.durationSeconds / 60).toFixed(0)} 分钟
              </span>
            ) : summary?.info ? (
              <span>{summary.info}</span>
            ) : (
              <span>输入起点与终点后，点击「查询路线」显示驾车路线概要。</span>
            )
          ) : (
            <span>输入起点与终点后，点击「查询路线」显示驾车路线概要。</span>
          )}
        </div>
        <div>
          <button className="btn" onClick={confirmSearch}>查询路线</button>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <MapRoute key={`${start}|${end}`} startAddress={start} endAddress={end} onSummary={setSummary} />
      </div>
    </section>
  );
};

export default RoutePanel;