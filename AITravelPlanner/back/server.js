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

// TODO: 将您的语音识别 API 密钥添加到 .env 文件中
const speechApiKey = process.env.SPEECH_API_KEY;

// TODO: 将您的地图 API 密钥添加到 .env 文件中
const mapApiKey = process.env.MAP_API_KEY;

app.post('/api/plan', async (req, res) => {
  try {
    const { destination, duration, interests } = req.body;

    const prompt = `请为我创建一个为期 ${duration} 天的 ${destination} 旅行计划。我的兴趣是 ${interests}。`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    res.json({ plan: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    res.status(500).json({ error: '调用 AI 服务时出错' });
  }
});

app.post('/api/budget', (req, res) => {
  // TODO: 使用 LLM API 实现 AI 预算分析逻辑
  const { expenses } = req.body;
  res.json({ message: '预算更新成功！', data: { expenses } });
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
});
const User = mongoose.model('User', UserSchema);

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
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

app.listen(port, () => {
  console.log(`服务器正在端口 ${port} 上运行`);
});