import React, { useState, useRef, useEffect } from 'react';
import RoutePanel from './RoutePanel';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const Plan = () => {
  const [plan, setPlan] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [recordingStatus, setRecordingStatus] = useState('');
  const audioChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const recognitionRef = useRef(null);
  const [startDate, setStartDate] = useState('');

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

  const generatePlanFromText = async () => {
    const nlpText = recognizedText || document.getElementById('nlpText').value || '';
    if (!nlpText.trim()) {
      alert('请先输入自然语言需求');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3000/api/plan', { nlpText });
      setPlan(response.data.plan);
    } catch (error) {
      console.error('Error generating plan from text:', error);
      alert('生成失败，请稍后重试');
    }
  };

  // ===== 浏览器语音识别兜底（Web Speech API） =====
  const startBrowserRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setRecordingStatus('当前浏览器不支持 Web Speech API');
      return;
    }
    const recog = new SR();
    recognitionRef.current = recog;
    recog.lang = 'zh-CN';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    setIsRecording(true);
    setRecordingStatus('浏览器语音识别中...');
    recog.onresult = (e) => {
      const text = e.results?.[0]?.[0]?.transcript || '';
      setRecognizedText(text);
      const nlpEl = document.getElementById('nlpText');
      if (nlpEl) nlpEl.value = text;
      const trimmed = String(text || '').trim();
      console.log('[WebSpeech] 识别文本:', trimmed);
      setRecordingStatus(`识别成功（浏览器）：${trimmed || '(空文本)'}`);
    };
    recog.onerror = (e) => {
      setRecordingStatus('浏览器识别错误: ' + (e.error || '未知错误'));
    };
    recog.onend = () => {
      setIsRecording(false);
    };
    try {
      recog.start();
    } catch (e) {
      setRecordingStatus('无法启动浏览器识别: ' + e.message);
      setIsRecording(false);
    }
  };

  // ===== 录音并在前端转 WAV(16k) =====
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
        const audioBlob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0]?.type || 'audio/webm' });
        console.log('[前端音频] MediaRecorder 停止: Blob 类型=', audioBlob.type, ' 片段数=', audioChunksRef.current.length);
        try {
          // 使用 AudioContext 解码成 AudioBuffer
          const arrayBuf = await audioBlob.arrayBuffer();
          console.log('[前端音频] Blob ArrayBuffer 长度:', arrayBuf.byteLength);
          const ac = new (window.AudioContext || window.webkitAudioContext)();
          const audioBuffer = await ac.decodeAudioData(arrayBuf);

          // 将 AudioBuffer 转为 16k 采样率的 WAV，并取 base64
          const base64data = audioBufferToWavBase64(audioBuffer, 16000);
          console.log('[前端音频] 生成 WAV(Base64) 长度:', base64data.length);

          // 调用后端科大讯飞API
          const response = await axios.post('http://localhost:3000/api/speech-recognition', {
            audioData: base64data
          });

          if (response.data.success) {
            console.log('[后端返回] /api/speech-recognition:', response.data);
            const textRaw = response.data.text ?? '';
            const text = String(textRaw);
            const trimmed = text.trim();
            if (!trimmed) {
              setRecordingStatus('识别成功但文本为空，切换到浏览器识别...');
              console.warn('[科大讯飞] 成功但空文本，启用浏览器兜底');
              try { stream.getTracks().forEach(track => track.stop()); } catch (_) {}
              startBrowserRecognition();
            } else {
              console.log('[科大讯飞] 识别文本(服务端):', trimmed);
              setRecognizedText(trimmed);
              const nlpEl = document.getElementById('nlpText');
              if (nlpEl) nlpEl.value = trimmed;
              setRecordingStatus(`识别成功：${trimmed}`);
            }
          } else {
            setRecordingStatus('识别失败，切换到浏览器识别...');
            try { stream.getTracks().forEach(track => track.stop()); } catch (_) {}
            startBrowserRecognition();
          }
        } catch (error) {
          console.error('语音处理/识别失败，启用浏览器兜底:', error);
          setRecordingStatus('请求失败，即将使用浏览器识别');
          try { stream.getTracks().forEach(track => track.stop()); } catch (_) {}
          startBrowserRecognition();
        }

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
      return;
    }
    if (recognitionRef.current && isRecording) {
      try { recognitionRef.current.stop(); } catch (_) {}
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

  // ===== 将 AudioBuffer 编码为 WAV(Base64)，并做 16k 下采样 =====
  function audioBufferToWavBase64(audioBuffer, targetSampleRate = 16000) {
    // 取单声道
    const srcRate = audioBuffer.sampleRate;
    const srcChannels = audioBuffer.numberOfChannels;
    let chData = srcChannels > 1
      ? mixToMono(audioBuffer.getChannelData(0), audioBuffer.getChannelData(1))
      : audioBuffer.getChannelData(0);
    console.log(`[前端音频] 解码 AudioBuffer: 采样率=${srcRate}, 声道=${srcChannels}, 原始长度=${chData.length}`);

    const down = downsampleBuffer(chData, srcRate, targetSampleRate);
    let peak = 0;
    for (let i = 0; i < down.length; i++) {
      const v = Math.abs(down[i]);
      if (v > peak) peak = v;
    }
    console.log(`[前端音频] 下采样至 ${targetSampleRate}Hz: 长度=${down.length}, 峰值=${peak.toFixed(6)}`);

    const wavBuffer = encodeWAV(down, targetSampleRate);
    const bytes = new Uint8Array(wavBuffer);
    console.log(`[前端音频] 生成 WAV 字节长度: ${bytes.byteLength}`);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function mixToMono(ch0, ch1) {
    const len = Math.min(ch0.length, ch1.length);
    const out = new Float32Array(len);
    for (let i = 0; i < len; i++) out[i] = (ch0[i] + ch1[i]) / 2;
    return out;
  }

  function downsampleBuffer(buffer, sampleRate, outRate) {
    if (outRate === sampleRate) return buffer;
    const ratio = sampleRate / outRate;
    const newLen = Math.floor(buffer.length / ratio);
    const result = new Float32Array(newLen);
    let offset = 0;
    for (let i = 0; i < newLen; i++) {
      // 简单平均法降采样
      const start = Math.floor(i * ratio);
      const end = Math.floor((i + 1) * ratio);
      let sum = 0, count = 0;
      for (let j = start; j < end && j < buffer.length; j++) { sum += buffer[j]; count++; }
      result[i] = count ? sum / count : buffer[start];
      offset = end;
    }
    return result;
  }

  function encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    // RIFF/WAVE header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM
    view.setUint16(20, 1, true); // format
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate (16-bit mono)
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    // PCM samples
    floatTo16BitPCM(view, 44, samples);
    return buffer;
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function floatTo16BitPCM(view, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  }

  return (
    <>
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
          <input
            type="date"
            id="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            onFocus={(e) => e.target.showPicker && e.target.showPicker()}
            inputMode="numeric"
            placeholder="YYYY-MM-DD"
          />
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
        <button className="btn" onClick={generatePlanFromText}>🧠 直接用自然语言生成</button>
        <button className="btn primary" id="genBtn" onClick={generatePlan}>✨ 生成行程</button>
      </div>
      <div style={{ marginTop: '14px' }}>
        <div className="result" id="planResult">
          {plan ? (
            <ReactMarkdown>{plan}</ReactMarkdown>
          ) : (
            <span className="hint">生成的行程会显示在这里。</span>
          )}
        </div>
      </div>
    </section>
    <RoutePanel />
    </>
  );
};

export default Plan;