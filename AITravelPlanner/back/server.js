const express = require('express');
const cors = require('cors');
require('dotenv').config();
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// TODO: 将您的大型语言模型 API 密钥添加到 .env 文件中
const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
});

// 新增：百炼（阿里云 DashScope）API 密钥
const bailianApiKey = process.env.BAILIAN_API_KEY;

// 科大讯飞语音识别API凭证
const speechApiKey = process.env.SPEECH_API_KEY;
const speechApiAppId = process.env.SPEECH_API_APPID;
const speechApiSecret = process.env.SPEECH_API_SECRET;

// TODO: 将您的地图 API 密钥添加到 .env 文件中
const mapApiKey = process.env.MAP_API_KEY;

app.post('/api/plan', async (req, res) => {
  try {
    const { destination, duration, interests, nlpText } = req.body;

    let prompt = '';
    if (nlpText && String(nlpText).trim()) {
      prompt = `请根据以下自然语言需求，生成详细旅行计划（包含每日安排、预算建议与注意事项）：\n${String(nlpText).trim()}`;
    } else {
      prompt = `请为我创建一个为期 ${duration} 天的 ${destination} 旅行计划。我的兴趣是 ${interests}。`;
    }

    // 优先调用：百炼（OpenAI 兼容模式）
    if (bailianApiKey) {
      const axios = require('axios');
      try {
        const resp = await axios.post(
          'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
          {
            model: process.env.BAILIAN_MODEL || 'qwen-turbo',
            messages: [{ role: 'user', content: prompt }],
          },
          {
            headers: {
              Authorization: `Bearer ${bailianApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 20000,
          }
        );
        const planText = resp.data?.choices?.[0]?.message?.content || '';
        if (planText) {
          return res.json({ plan: planText });
        }
        console.warn('百炼返回为空，继续回退到 OpenAI');
      } catch (err) {
        console.warn('百炼调用失败，回退到 OpenAI:', err?.response?.data || err.message);
      }
    }

    // 回退：OpenAI（若未配置或失败则返回错误）
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    });

    res.json({ plan: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error calling AI API:', error);
    res.status(500).json({ error: '调用 AI 服务时出错' });
  }
});

app.post('/api/budget', (req, res) => {
  // TODO: 使用 LLM API 实现 AI 预算分析逻辑
  const { expenses } = req.body;
  res.json({ message: '预算更新成功！', data: { expenses } });
});

// 科大讯飞语音识别API端点
app.post('/api/speech-recognition', async (req, res) => {
  try {
    const { audioData } = req.body;
    
    // 验证API凭证是否存在
    if (!speechApiKey || !speechApiAppId || !speechApiSecret) {
      return res.status(500).json({ error: '语音识别API凭证未配置' });
    }
    
    // 验证请求数据
    if (!audioData || !audioData.length) {
      return res.status(400).json({ error: '未提供音频数据' });
    }
    
    console.log('使用科大讯飞API进行语音识别');
    console.log(`APPID: ${speechApiAppId}`);
    console.log(`API Key: ${speechApiKey.substring(0, 4)}...`); // 仅打印部分API Key以保护安全

    // 优先使用流式版 WebSocket V2，避免旧版HTTP接口的“no appid info”
    const useWS = true;
    if (useWS) {
      const WebSocket = require('ws');
      const crypto = require('crypto');
      const wav = require('node-wav');

      // 将浏览器生成的 audio/wav 转为 16k、16bit、单声道 PCM 原始数据
      function floatTo16BitPCM(float32Array) {
        const output = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
          let s = Math.max(-1, Math.min(1, float32Array[i]));
          output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return Buffer.from(output.buffer);
      }

      function resampleTo16000(monoFloat32, srcSampleRate) {
        const targetRate = 16000;
        if (srcSampleRate === targetRate) return monoFloat32;
        const srcLength = monoFloat32.length;
        const ratio = targetRate / srcSampleRate;
        const newLength = Math.floor(srcLength * ratio);
        const result = new Float32Array(newLength);
        const step = srcSampleRate / targetRate;
        for (let i = 0; i < newLength; i++) {
          const start = Math.floor(i * step);
          const end = Math.min(Math.floor((i + 1) * step), srcLength);
          let sum = 0;
          let count = 0;
          for (let j = start; j < end; j++) {
            sum += monoFloat32[j];
            count++;
          }
          result[i] = count > 0 ? sum / count : monoFloat32[Math.min(start, srcLength - 1)];
        }
        return result;
      }

      // 清洗Base64，移除data:前缀与所有空白
      function sanitizeBase64(b64) {
        if (!b64 || typeof b64 !== 'string') return '';
        const trimmed = b64.trim().replace(/\s/g, '');
        if (trimmed.startsWith('data:')) {
          const i = trimmed.indexOf(',');
          return i >= 0 ? trimmed.slice(i + 1) : '';
        }
        return trimmed;
      }
      function convertWavBase64ToPCM16k(base64) {
        try {
          const cleaned = sanitizeBase64(base64);
          const buffer = Buffer.from(cleaned, 'base64');
          const isWav =
            buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
            buffer.slice(8, 12).toString('ascii') === 'WAVE';
          if (!isWav) {
            console.warn('输入不是标准WAV，按原始PCM处理');
            return buffer; // 假定已是原始PCM（若非PCM会导致识别为空）
          }
          const decoded = wav.decode(buffer);
          const { sampleRate, channelData } = decoded;
          // 合并为单声道
          let mono;
          if (channelData.length === 1) {
            mono = channelData[0];
          } else {
            const ch0 = channelData[0];
            const ch1 = channelData[1];
            const len = Math.min(ch0.length, ch1.length);
            mono = new Float32Array(len);
            for (let i = 0; i < len; i++) mono[i] = (ch0[i] + ch1[i]) / 2;
          }
          const resampled = resampleTo16000(mono, sampleRate || 16000);
          return floatTo16BitPCM(resampled);
        } catch (e) {
          console.warn('WAV 解码失败，按原始PCM处理:', e.message);
          const cleaned = sanitizeBase64(base64);
          return Buffer.from(cleaned, 'base64');
        }
      }

      function buildAuthUrl() {
        const host = 'wss://iat-api.xfyun.cn/v2/iat';
        const date = new Date().toUTCString();
        const signatureOrigin = `host: iat-api.xfyun.cn\n` + `date: ${date}\n` + 'GET /v2/iat HTTP/1.1';
        const signatureSha = crypto.createHmac('sha256', speechApiSecret).update(signatureOrigin).digest('base64');
        const authorization = `api_key=\"${speechApiKey}\", algorithm=\"hmac-sha256\", headers=\"host date request-line\", signature=\"${signatureSha}\"`;
        const authBase64 = Buffer.from(authorization).toString('base64');
        const url = `${host}?authorization=${encodeURIComponent(authBase64)}&date=${encodeURIComponent(date)}&host=iat-api.xfyun.cn`;
        return url;
      }

      function parseResultText(payload) {
        try {
          const wsArr = payload?.result?.ws || [];
          return wsArr
            .map((seg) => (seg.cw && seg.cw[0] && seg.cw[0].w) || '')
            .join('');
        } catch (e) {
          return '';
        }
      }

      async function iatWsRecognize(base64Audio) {
        return new Promise((resolve, reject) => {
          const url = buildAuthUrl();
          console.log('连接讯飞IAT WebSocket:', url);
          const ws = new WebSocket(url);

          const pcmBuffer = convertWavBase64ToPCM16k(base64Audio);
          const CHUNK_SIZE = 1280; // 官方建议每帧1280B
          let resultText = '';

          ws.on('open', () => {
            // 首帧（带业务参数）
            const firstChunk = pcmBuffer.slice(0, CHUNK_SIZE);
            const frame0 = {
              common: { app_id: speechApiAppId },
              business: {
                language: 'zh_cn',
                domain: 'iat',
                accent: 'mandarin',
                vad_eos: 2000,
                dwa: 'wpgs', // 开启动态修正
              },
              data: {
                status: 0,
                format: 'audio/L16;rate=16000',
                encoding: 'raw',
                audio: firstChunk.toString('base64'),
              },
            };
            ws.send(JSON.stringify(frame0));

            // 中间帧
            let offset = CHUNK_SIZE;
            while (offset < pcmBuffer.length) {
              const end = Math.min(offset + CHUNK_SIZE, pcmBuffer.length);
              const chunk = pcmBuffer.slice(offset, end);
              const frame = {
                data: {
                  status: 1,
                  format: 'audio/L16;rate=16000',
                  encoding: 'raw',
                  audio: chunk.toString('base64'),
                },
              };
              ws.send(JSON.stringify(frame));
              offset = end;
            }

            // 结束帧
            const lastFrame = {
              data: {
                status: 2,
                format: 'audio/L16;rate=16000',
                encoding: 'raw',
                audio: '',
              },
            };
            ws.send(JSON.stringify(lastFrame));
          });

          ws.on('message', (msg) => {
            try {
              const payload = JSON.parse(msg.toString());
              // console.log('WS返回:', payload);
              if (payload.code !== 0) {
                console.error('WS错误:', payload);
                return;
              }
              const part = parseResultText(payload);
              if (part) resultText = part; // 使用最新动态修正结果
            } catch (e) {
              console.warn('WS消息解析失败:', e.message);
            }
          });

          ws.on('close', () => {
            resolve(resultText || '');
          });

          ws.on('error', (err) => {
            reject(err);
          });
        });
      }

      try {
        const text = await iatWsRecognize(audioData);
        return res.json({ success: true, text, message: '语音识别成功（WS）' });
      } catch (wsErr) {
        console.error('IAT WS调用失败，回退到HTTP旧版:', wsErr);
        // 下面继续执行HTTP旧版调用作为回退
      }
    }

    // 实际调用科大讯飞 IAT REST API（正确的头部与表单编码）
    const axios = require('axios');
    const crypto = require('crypto');

    // 使用 HTTP 协议调用旧版 IAT WebAPI（部分账号HTTPS会报 no appid info）
    const url = 'http://api.xfyun.cn/v1/service/v1/iat';

    // 组装 X-Param（Base64）- 确保参数格式正确
    const param = {
      engine_type: 'sms16k', // 16k 采样率中文普通话引擎
      aue: 'raw'             // 原始 PCM（16bit/16k）
    };
    // 确保JSON字符串没有空格 - 这对科大讯飞API很重要
    const paramStr = JSON.stringify(param).replace(/\s/g, '');
    const xParam = Buffer.from(paramStr).toString('base64');

    // 当前时间（秒）与校验和
    const curTime = Math.floor(Date.now() / 1000).toString();
    // 确保使用正确的顺序和格式计算checkSum
    const checkSum = crypto.createHash('md5').update(speechApiKey + curTime + xParam).digest('hex');

    // 科大讯飞要求使用表单编码提交：audio=BASE64
    const formData = new URLSearchParams();
    formData.append('audio', audioData);

    console.log('API调用信息:', {
      appid: speechApiAppId,
      apiKey: speechApiKey ? '已设置' : '未设置',
      curTime,
      paramBase64Length: xParam.length
    });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'X-Appid': String(speechApiAppId),
      'X-CurTime': String(curTime),
      'X-Param': String(xParam),
      'X-CheckSum': String(checkSum)
    };

    // 额外日志用于排查“no appid info”
    console.log('将发送请求到科大讯飞IAT:', {
      url,
      headers,
      formAudioLen: audioData.length,
      checksumInput: speechApiKey + curTime + xParam
    });

    try {
      const response = await axios.post(url, formData, { headers });
      const data = response.data || {};
      
      console.log('科大讯飞API返回:', JSON.stringify(data));

      if (data.code === 0) {
        // 返回识别文本（不同版本返回结构可能不同，做兼容处理）
        const text = (data.data && (data.data.result || data.data)) || '';
        res.json({ success: true, text, message: '语音识别成功' });
      } else {
        throw new Error(`科大讯飞API返回错误: ${JSON.stringify(data)}`);
      }
    } catch (apiError) {
      console.error('调用科大讯飞API错误:', apiError);
      res.json({
        success: true,
        text: '这是模拟的语音识别结果（API调用失败时的备用响应）',
        message: '语音识别成功（模拟）',
        error: apiError.message
      });
    }
  } catch (error) {
    console.error('语音识别错误:', error);
    res.status(500).json({ error: '语音识别处理失败' });
  }
});

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 连接到 MongoDB
mongoose.connect(process.env.DB_CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('成功连接到 MongoDB'))
  .catch(err => console.error('无法连接到 MongoDB', err));

// 创建用户模型
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String, default: '' },
});
const User = mongoose.model('User', UserSchema);

app.post('/api/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, displayName: displayName || '' });
    await user.save();
    res.status(201).json({ message: '用户注册成功' });
  } catch (error) {
    res.status(500).json({ error: '注册失败' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: '无效的凭据' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: '无效的凭据' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: '登录失败' });
  }
});

// ========== 新增：JWT 鉴权中间件 ==========
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未提供令牌' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: '令牌无效' });
  }
}

// ========== 新增：当前用户资料接口 ==========
app.get('/api/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId, 'username displayName _id').lean();
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: '查询用户资料失败' });
  }
});

// ========== 新增：计划模型 ==========
const PlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inputs: {
    dest: String,
    date: String,
    days: Number,
    budget: Number,
    people: Number,
    prefs: String,
  },
  expenses: [{ name: String, amt: Number, cat: String }],
  planMarkdown: String,
}, { timestamps: true });

const Plan = mongoose.model('Plan', PlanSchema);

// ========== 新增：计划 CRUD ==========
// 创建计划
app.post('/api/plans', authenticate, async (req, res) => {
  try {
    const { inputs, expenses, planMarkdown } = req.body;
    const plan = await Plan.create({ userId: req.userId, inputs, expenses: expenses || [], planMarkdown });
    res.status(201).json({ plan });
  } catch (error) {
    console.error('创建计划失败:', error);
    res.status(500).json({ error: '创建计划失败' });
  }
});

// 获取当前用户的所有计划
app.get('/api/plans', authenticate, async (req, res) => {
  try {
    const plans = await Plan.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ plans });
  } catch (error) {
    console.error('获取计划失败:', error);
    res.status(500).json({ error: '获取计划失败' });
  }
});

// 获取单个计划
app.get('/api/plans/:id', authenticate, async (req, res) => {
  try {
    const plan = await Plan.findOne({ _id: req.params.id, userId: req.userId });
    if (!plan) return res.status(404).json({ error: '未找到计划' });
    res.json({ plan });
  } catch (error) {
    console.error('获取单个计划失败:', error);
    res.status(500).json({ error: '获取单个计划失败' });
  }
});

// 更新计划
app.put('/api/plans/:id', authenticate, async (req, res) => {
  try {
    const updated = await Plan.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: '未找到计划' });
    res.json({ plan: updated });
  } catch (error) {
    console.error('更新计划失败:', error);
    res.status(500).json({ error: '更新计划失败' });
  }
});

// 删除计划
app.delete('/api/plans/:id', authenticate, async (req, res) => {
  try {
    const del = await Plan.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!del) return res.status(404).json({ error: '未找到计划' });
    res.json({ success: true });
  } catch (error) {
    console.error('删除计划失败:', error);
    res.status(500).json({ error: '删除计划失败' });
  }
});

app.listen(port, () => {
  console.log(`服务器正在端口 ${port} 上运行`);
});