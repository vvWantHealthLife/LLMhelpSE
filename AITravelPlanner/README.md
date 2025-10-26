# AI 旅行规划师

该项目是一个基于 Web 的 AI 旅行规划师，通过对话界面帮助用户规划行程。

## 功能

- **智能行程规划**：根据用户输入生成个性化旅行计划。
- **预算管理**：跟踪和管理旅行开支。
- **用户账户**：保存和管理多个旅行计划。

## 入门指南

### 先决条件

- Node.js 和 npm
- Git

### 设置

1. **克隆存储库：**
   ```bash
   git clone <repository-url>
   ```

2. **后端设置：**
   - 导航到 `back` 目录：
     ```bash
     cd AITravelPlanner/back
     ```
   - 安装依赖项：
     ```bash
     npm install
     ```
   - 创建一个 `.env` 文件并添加您的 API 密钥：
     ```
     LLM_API_KEY=your_large_language_model_api_key
     SPEECH_API_KEY=your_speech_recognition_api_key
     MAP_API_KEY=your_map_api_key
     ```

3. **前端设置：**
   - 导航到 `front` 目录：
     ```bash
     cd ../front
     ```
   - 安装依赖项：
     ```bash
     npm install
     ```

### 运行应用程序

1. **启动后端服务器：**
   - 在 `back` 目录中，运行：
     ```bash
     ~/.nvm/versions/node/v25.0.0/bin/node server.js
     ```
   - 服务器将在 `http://localhost:3000` 上启动。

2. **启动前端开发服务器：**
   - 在 `front` 目录中，运行：
     ```bash
     ./node_modules/vite/bin/vite.js
     ```
   - 应用程序将在 `http://localhost:5173` 上可用。