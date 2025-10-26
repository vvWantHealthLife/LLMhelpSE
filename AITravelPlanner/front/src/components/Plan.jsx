import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Plan = () => {
  const [plan, setPlan] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('');
  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setRecordingStatus('处理中...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // 将音频数据转换为base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result.split(',')[1];
          
          try {
            // 调用后端科大讯飞API
            const response = await axios.post('http://localhost:3000/api/speech-recognition', {
              audioData: base64data
            });
            
            if (response.data.success) {
              setRecognizedText(response.data.text);
              document.getElementById('nlpText').value = response.data.text;
              setRecordingStatus('识别成功');
            } else {
              setRecordingStatus('识别失败: ' + response.data.error);
            }
          } catch (error) {
            console.error('语音识别请求失败:', error);
            setRecordingStatus('请求失败: ' + error.message);
          }
        };
        
        // 关闭麦克风
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingStatus('录音中...');
    } catch (error) {
      console.error('无法访问麦克风:', error);
      setRecordingStatus('错误: 无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <section className="card" id="panel-plan">
      <h2>1) 智能行程规划</h2>
      <div className="row">
        <div style={{ flex: '1 1 240px' }}>
          <label>自然语言需求（可语音）</label>
          <textarea id="nlpText" placeholder="例如：我想去日本，5天，预算1万元，喜欢美食和动漫，带孩子" value={recognizedText} onChange={(e) => setRecognizedText(e.target.value)}></textarea>
          <div className="row" style={{ marginTop: '8px' }}>
            <button 
              className={`btn ${isRecording ? 'warn' : ''}`} 
              id="micBtn" 
              onClick={handleMicClick}
            >
              {isRecording ? '🛑 停止录音' : '🎤 开始语音'}
            </button>
            <span className="hint" id="sttHint">
              {recordingStatus || '使用科大讯飞API进行语音识别'}
            </span>
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