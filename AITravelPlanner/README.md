# AITravelPlanner

我的所有APIkey均存放在github中后端相关的.env文件中

一个端到端的 AI 旅行规划演示项目，包含自然语言解析、智能行程生成、预算记录与分析、地图路线、用户注册登录与计划云端存储。前端使用 React + Vite，后端使用 Node.js + Express + MongoDB，并集成 OpenAI 与阿里云百炼（DashScope）两套 LLM 以及科大讯飞语音识别与高德地图。

## 功能亮点
- 智能行程规划：支持直接输入自然语言或结构化表单，调用 LLM 生成 Markdown 行程。
- 自然语言解析：将中文需求解析为目的地、日期、天数、预算、人数、偏好等结构化字段。
- 语音输入：上传音频至后端使用科大讯飞 IAT 接口识别，失败时前端回退浏览器 Web Speech API。
- 预算记录与分析：添加预算项，统计合计与进度条，并使用 LLM 输出简短中文预算建议（含本地兜底）。
- 地图与路线：前端高德 JSAPI 驾车路线，失败时调用后端高德 REST 兜底；同时提供独立测试页。
- 用户与计划存储：注册/登录（JWT），云端保存与加载计划，计划模型包含表单 `inputs`、预算项 `expenses`、行程内容 `planMarkdown` 与自然语言 `nlpText`。
- 本地持久化与联动：行程表单、自然语言、预算项与预算总额均持久化到 `localStorage` 并在不同模块间联动。

## 技术栈
- 前端
  - `React 18`、`Vite 4`、`react-markdown`
  - 网络：`axios`
  - 地图：高德 JSAPI（`front/src/amapConfig.js` 配置 Key 与安全码）
- 后端
  - `Node.js`、`Express`、`Mongoose`（MongoDB）
  - 身份认证：`jsonwebtoken`、`bcryptjs`
  - 网络：`axios`、`ws`（语音识别流式工具）
  - LLM：`openai`（通过 `LLM_API_KEY`）、阿里云百炼 DashScope 兼容模式（`BAILIAN_API_KEY`）
  - 语音识别：科大讯飞 IAT（`SPEECH_API_*`）
  - 地图：高德 REST API（`MAP_API_KEY`）

## 项目结构
```
AITravelPlanner/
├─ front/                     # 前端（React + Vite）
│  ├─ index.html
│  ├─ package.json
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ style.css
│  │  ├─ amapConfig.js        # 高德 JSAPI Key 与安全码（前端）
│  │  ├─ components/
│  │  │  ├─ Plan.jsx          # 智能行程规划（表单、自然语言、语音识别）
│  │  │  ├─ Budget.jsx        # 预算记录与分析
│  │  │  ├─ Account.jsx       # 账户管理与云端计划存取
│  │  │  ├─ MapRoute.jsx      # 高德路线组件（前端/后端兜底）
│  │  │  └─ RoutePanel.jsx    # 路线查询面板
│  │  └─ pages/
│  │     └─ Auth.jsx          # 登录/注册页
│  ├─ try.html                 # 早期静态原型（无后端）
│  └─ gaode-test.html         # 高德路线独立测试页
└─ back/                      # 后端（Express + MongoDB）
   ├─ server.js               # 主服务（API 路由、模型、集成）
   ├─ package.json
   └─ scripts/
      └─ inspectUsers.js      # 数据库调试脚本（示例）
```

## 环境变量（后端 `.env`）
- 基本
  - `PORT`：后端端口，默认 `3000`
  - `MAX_BODY_SIZE`：请求体大小限制，默认 `15mb`
  - `DB_CONNECTION_STRING`：MongoDB 连接串，如 `mongodb://localhost:27017/ai_travel_planner`
  - `JWT_SECRET`：JWT 签名密钥
- LLM
  - `LLM_API_KEY`：OpenAI API Key（后端使用 `openai` 包）
  - `OPENAI_MODEL`：OpenAI 模型名（默认 `gpt-3.5-turbo`）
  - `BAILIAN_API_KEY`：阿里云百炼 DashScope Key（兼容模式）
  - `BAILIAN_MODEL`：百炼模型名（默认 `qwen-turbo`）
- 地图
  - `MAP_API_KEY`：高德 REST API Key（后端地理编码与路线兜底）
- 语音识别（科大讯飞 IAT）
  - `SPEECH_API_KEY`
  - `SPEECH_API_APPID`
  - `SPEECH_API_SECRET`

示例 `.env`（位于 `back/.env`）：
```
PORT=3000
MAX_BODY_SIZE=15mb
DB_CONNECTION_STRING=mongodb://localhost:27017/ai_travel_planner
JWT_SECRET=replace_me

LLM_API_KEY=your_openai_key
OPENAI_MODEL=gpt-3.5-turbo

BAILIAN_API_KEY=your_dashscope_key
BAILIAN_MODEL=qwen-turbo

MAP_API_KEY=your_amap_rest_key

SPEECH_API_KEY=your_xfyun_api_key
SPEECH_API_APPID=your_xfyun_appid
SPEECH_API_SECRET=your_xfyun_secret
```

前端高德 JSAPI（需修改 `front/src/amapConfig.js`）：
```
export const AMAP_KEY = 'your_amap_js_key';
export const AMAP_SECURITY_CODE = 'your_amap_security_code';
```

## 安装与启动
- 前置要求
  - Node.js `>= 18`
  - 可用的 MongoDB 实例（本地或云端）
  - 对应的第三方密钥（可按需逐步配置：LLM、地图、语音）

- 安装依赖
  - 前端：进入 `front` 目录执行：
    - `npm install`
  - 后端：进入 `back` 目录执行：
    - `npm install`

- 启动后端（开发）
  - 在 `back` 目录：
    - `npm start`
  - 默认监听 `http://localhost:3000/`

- 启动前端（开发）
  - 在 `front` 目录：
    - `npm run dev`
  - 打开 Vite 输出的地址（默认 `http://localhost:5173/`）。

- 前端访问后端（二选一）
  - 选项 A：配置 Vite 代理（推荐）。在 `front` 新建 `vite.config.js`：
    ```js
    import react from '@vitejs/plugin-react';
    export default {
      plugins: [react()],
      server: { proxy: { '/api': 'http://localhost:3000' } }
    }
    ```
  - 选项 B：为 `axios` 设置基础地址（仅开发）。在前端初始化处添加：
    ```js
    import axios from 'axios';
    axios.defaults.baseURL = 'http://localhost:3000';
    ```

- 生产构建与预览
  - 在 `front` 目录：
    - `npm run build`
    - `npm run serve`（预览构建产物）

## 使用指南
- 登录/注册
  - 启动后默认显示 `Auth` 登录页。注册成功后自动登录，JWT 写入 `localStorage` 且设置到 `axios` 头部。

- 智能行程规划（`Plan.jsx`）
  - 直接输入自然语言或使用麦克风录音（HTTP 上传到后端科大讯飞 IAT，失败回退浏览器识别）。
  - 点击“从自然语言中提取并填充”调用 `POST /api/parse` 自动填充表单字段。
  - 点击“生成行程”调用 `POST /api/plan`，返回 Markdown 行程并显示；同时清空预算项并广播 `atp:expensesReset`（预算模块监听此事件）。
  - 表单与自然语言会持久化到 `localStorage` 并在刷新后恢复。

- 费用预算与管理（`Budget.jsx`）
  - 添加预算项（名称、金额、类别），自动统计“预算上限/已花费/剩余/百分比”。
  - 点击“分析预算”调用 `POST /api/budget`，返回简短中文建议与更准确的汇总；如 LLM 与调用失败，使用本地兜底建议。
  - 预算上限与“智能行程规划”的预算联动（`window.__budget`/`localStorage`）。

- 用户管理与数据存储（`Account.jsx`）
  - 登录后可“保存当前行程+预算”到云端，后端计划模型包含：
    - `inputs`：`{ dest, date, days, budget, people, prefs }`
    - `expenses`：`[{ name, amt, cat }]`
    - `planMarkdown`：行程内容（Markdown 文本）
    - `nlpText`：自然语言需求原文
  - 列表项展示目的地、天数与预算（来自“智能行程规划”表单），展开可见 `nlpText`、`planMarkdown` 与预算项摘要。

- 地图与路线
  - 在“地图与路线测试（高德）”面板输入起点/终点，使用 JSAPI 规划路线，失败自动尝试后端 `/api/map/geocode` 与 `/api/map/route` 兜底。
  - `front/gaode-test.html` 提供独立页面验证路线规划与地理编码。

## 本地持久化键（约定）
- `atp_inputs`：行程表单（JSON）
- `atp_nlp_text`：自然语言需求（字符串）
- `atp_expenses`：预算项（JSON 数组）
- `atp_budget_total`：预算总额（数字字符串）
- `atp_plan_md`：生成的行程（Markdown 文本）
- 运行时桥接：`window.__budget`（`{ budgetTotal, expenses }`）与自定义事件 `atp:expensesReset`

## 后端 API 速览
- 地图
  - `GET /api/map/config`：查询后端是否配置了 `MAP_API_KEY`
  - `POST /api/map/geocode`：地址地理编码（高德 REST）
  - `POST /api/map/route`：驾车路线规划（高德 REST），支持地址或坐标对象
- 规划与解析
  - `POST /api/plan`：生成行程（优先百炼 DashScope，回退 OpenAI）
  - `POST /api/parse`：解析中文需求为结构化字段（优先百炼，回退 OpenAI，本地兜底）
- 预算
  - `POST /api/budget`：预算统计与建议（优先 LLM，本地兜底）
- 语音识别
  - `POST /api/speech-recognition`：HTTP 上传音频（Base64）进行识别（科大讯飞 IAT），失败返回模拟文本以便演示
- 认证与用户
  - `POST /api/register`：注册（用户名/密码/昵称）
  - `POST /api/login`：登录（返回 `token`）
  - `GET /api/me`：当前用户信息（需 `Authorization: Bearer <token>`）
- 计划 CRUD（需登录）
  - `POST /api/plans`：创建计划（保存 `inputs`/`expenses`/`planMarkdown`/`nlpText`）
  - `GET /api/plans`：我的计划列表（按创建时间倒序）
  - `GET /api/plans/:id`：获取单个计划
  - `PUT /api/plans/:id`：更新计划
  - `DELETE /api/plans/:id`：删除计划

## 数据模型
- `User`
  - `username`（唯一）
  - `password`（bcrypt 哈希）
  - `displayName`
- `Plan`
  - `userId`（关联 `User`）
  - `inputs`（对象：`dest/date/days/budget/people/prefs`）
  - `expenses`（数组：`{ name, amt, cat }`）
  - `planMarkdown`（字符串）
  - `nlpText`（字符串）
  - 自动 `timestamps`（`createdAt/updatedAt`）

## 调试与常见问题
- 端口占用：Vite 默认 `5173`，如被占用会自动换端口；请以终端实际输出为准。
- 跨域与代理：未配置代理时，前端相对路径 `/api` 指向前端端口；建议按“前端访问后端”章节配置代理或显式 `baseURL`。
- LLM Key 未配置：`/api/plan` 与 `/api/parse` 会回退到本地启发式；`/api/budget` 会回退到本地建议。
- 科大讯飞凭证未配置：`/api/speech-recognition` 返回模拟识别文本，前端提示并正常展示。
- 数据库连接：使用 `back/scripts/inspectUsers.js` 可快速验证用户集合与索引。

## 开源与安全提示
- 本项目为演示用途，前端将 `token` 存储在 `localStorage` 并直接设置到 `axios` 头部，生产环境请参考更安全的存储策略（如 HttpOnly Cookie、CSRF 防护等）。
- 前端包含演示用高德 JSAPI Key 与安全码，请替换为自己的密钥并开启域名白名单。
- 请妥善保管各类密钥与连接串，切勿提交到公共仓库。

---
如需进一步扩展（地图展示、计划分享、多人协作、费用报表等），欢迎在现有结构上追加模块与路由。祝开发顺利！

## Docker 镜像与发布
- 镜像构建与推送
  - 仓库已添加前后端 `Dockerfile`（`back/Dockerfile`、`front/Dockerfile`）和 CI 工作流（`.github/workflows/docker.yml`）。
  - 在 GitHub 仓库设置 Secrets：
    - `ACR_SERVER`：如 `registry.cn-hangzhou.aliyuncs.com`
    - `ACR_NAMESPACE`：你的命名空间，如 `your_namespace`
    - `ACR_USERNAME`：阿里云容器镜像服务登录用户名（或子账号 AK）
    - `ACR_PASSWORD`：登录密码（或子账号 SK）
  - 推送到 `main` 分支或手动触发后，Actions 会分别构建并推送：
    - 后端：`${ACR_SERVER}/${ACR_NAMESPACE}/ai-travel-planner-backend:latest` 与 `:${GITHUB_SHA}`
    - 前端：`${ACR_SERVER}/${ACR_NAMESPACE}/ai-travel-planner-frontend:latest` 与 `:${GITHUB_SHA}`

- 直接拉取与运行（单容器）
  - 后端（需要 `.env` 或传入环境变量）：
    - `docker pull ${ACR_SERVER}/${ACR_NAMESPACE}/ai-travel-planner-backend:latest`
    - `docker run --rm -p 3000:3000 --env-file back/.env ${ACR_SERVER}/${ACR_NAMESPACE}/ai-travel-planner-backend:latest`
  - 前端（静态站点，Nginx 提供）：
    - `docker pull ${ACR_SERVER}/${ACR_NAMESPACE}/ai-travel-planner-frontend:latest`
    - `docker run --rm -p 8080:80 ${ACR_SERVER}/${ACR_NAMESPACE}/ai-travel-planner-frontend:latest`
  - 访问：前端 `http://localhost:8080/`；后端 `http://localhost:3000/`

- 一键本地运行（Compose）
  - 在项目根创建 `.env.docker`（示例）：
    ```
    REGISTRY=registry.cn-hangzhou.aliyuncs.com
    NAMESPACE=your_namespace
    TAG=latest
    # 后端环境变量（可复用 back/.env 的内容）
    DB_CONNECTION_STRING=mongodb://localhost:27017/ai_travel_planner
    JWT_SECRET=replace_me
    MAX_BODY_SIZE=15mb
    LLM_API_KEY=your_openai_key
    OPENAI_MODEL=gpt-3.5-turbo
    BAILIAN_API_KEY=your_dashscope_key
    BAILIAN_MODEL=qwen-turbo
    MAP_API_KEY=your_amap_rest_key
    SPEECH_API_KEY=your_xfyun_api_key
    SPEECH_API_APPID=your_xfyun_appid
    SPEECH_API_SECRET=your_xfyun_secret
    ```
  - 启动：`docker compose --env-file .env.docker up -d`
  - 访问：前端 `http://localhost:8080/`；后端 `http://localhost:3000/`

- 离线镜像（tar 文件，可下载分发）
  - 导出：
    - `docker save -o ai-travel-planner-backend.tar ${ACR_SERVER}/${ACR_NAMESPACE}/ai-travel-planner-backend:latest`
    - `docker save -o ai-travel-planner-frontend.tar ${ACR_SERVER}/${ACR_NAMESPACE}/ai-travel-planner-frontend:latest`
  - 导入：
    - `docker load -i ai-travel-planner-backend.tar`
    - `docker load -i ai-travel-planner-frontend.tar`

  - GitHub Release 离线包使用（推荐给老师验收）：
    - 从 Release 下载资产：`ai-travel-planner-backend-<TAG>.tar`、`ai-travel-planner-frontend-<TAG>.tar`、`docker-compose.offline.yml`、`.env.docker`
    - 加载镜像：
      - `docker load -i ai-travel-planner-backend-<TAG>.tar`
      - `docker load -i ai-travel-planner-frontend-<TAG>.tar`
    - 启动服务：
      - 按需编辑 `.env.docker`（填入需要的 Key，可留空以走本地兜底）
      - `docker compose -f docker-compose.offline.yml --env-file .env.docker up -d`
    - 访问：前端 `http://localhost:8080/`，后端 `http://localhost:3000/`
    - 验证命令：
      - `curl http://localhost:3000/api/map/config` 应返回 `{"enabled":true,...}`
      - `curl -X POST http://localhost:3000/api/parse -H 'Content-Type: application/json' -d '{"text":"去日本京都玩三天，美食动漫预算一万"}'`
      - `curl -X POST http://localhost:3000/api/plan -H 'Content-Type: application/json' -d '{"dest":"京都","days":3,"budget":10000,"people":1,"prefs":"美食,动漫"}'`

- 重要说明
  - 前端部分接口使用相对路径 `/api`，也有少量硬编码 `http://localhost:3000`（地图与语音等）。使用 Compose 在本机运行时保持端口映射为 `3000`/`8080` 即可正常访问；远程部署建议统一为相对路径并用反向代理处理 `/api`，或在构建前设置统一的 `axios` 基础地址。