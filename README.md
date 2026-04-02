# Design AI

<p align="center">
  <strong>体验设计 Agent 前端</strong>
</p>

<p align="center">
  Design AI 的前端交互项目。通过自然语言驱动 AI Agent 完成体验设计流程，实时生成 Vue 3 组件代码，支持在线预览、编辑与项目导出。
</p>

---

## 功能特性

- **自然语言输入** -- 用纯文本描述 UI 需求，或上传设计图 / Markdown 附件
- **实时流式生成** -- 基于 SSE 的多阶段流水线，实时追踪生成进度（附件处理、需求标准化、代码生成、UX 优化）
- **在线实时预览** -- 基于 `@vue/repl` 的浏览器内 Vue SFC 编译与预览
- **代码编辑器** -- Monaco Editor，支持自定义 Vue 语言语法高亮及文件树导航
- **组件库支持** -- 可选 Element Plus 或 CcUI（85+ 自定义组件）生成代码
- **项目导出** -- 将生成代码导出为完整的 Vite + Vue 3 项目（ZIP）或静态 HTML
- **阶段重试** -- 可从任意失败的流水线阶段重试生成
- **会话管理** -- 创建、重命名、删除、切换多个聊天会话
- **响应式预览** -- 视口切换（桌面端 / 平板 / 手机）与缩放控制

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 3.5（Composition API，`<script setup>`） |
| 语言 | TypeScript 5.9 |
| 构建工具 | Vite 7.3 |
| 状态管理 | Pinia 3 |
| 路由 | Vue Router 4 |
| UI 组件库（应用） | Element Plus 2.9 |
| CSS 框架 | Tailwind CSS 4.2 |
| 代码编辑器 | Monaco Editor 0.55 |
| 实时预览 | @vue/repl 4.7 |
| Markdown 渲染 | marked 17 |
| 项目导出 | JSZip 3.10 |
| 工具库 | @vueuse/core 14 |

## 环境要求

- **Node.js** >= 18（需兼容 Vite 7.x）
- **后端 API 服务**运行在 `localhost:8002`（应用会将 `/api/*` 和 `/output/*` 代理到后端）

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动 Vite 开发服务器，监听 `http://localhost:3000`，自动打开浏览器。`/api/generate` 和 `/output` 请求会被代理到 `http://localhost:8002`。

### 生产构建

```bash
npm run build
```

先执行 TypeScript 类型检查（`tsc`），再执行 Vite 构建，产物输出到 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

在本地启动静态服务器预览 `dist/` 目录。

## 项目结构

```
vue-code-gen/
├── index.html                  # SPA 入口 HTML
├── package.json                # 项目配置
├── vite.config.ts              # Vite 配置（代理、别名、插件）
├── tsconfig.json               # TypeScript 配置
├── tsconfig.node.json          # TypeScript 配置（Vite / Node）
├── postcss.config.js           # PostCSS 配置
├── public/                     # 静态资源
└── src/
    ├── main.ts                 # 应用入口
    ├── App.vue                 # 根组件
    ├── style.css               # 全局 Tailwind CSS 导入
    ├── vite-env.d.ts           # Vite 类型声明
    ├── api/                    # API 接口层
    │   ├── index.ts            # REST API 客户端（会话、消息、上传）
    │   └── sse.ts              # SSE 流式客户端（代码生成）
    ├── ccui/                   # CcUI 组件库（85+ 组件，用于生成时打包注入）
    │   └── components/
    ├── components/             # 应用级 Vue 组件
    │   ├── AppHeader.vue       # 顶部导航栏
    │   ├── ChatPanel.vue       # 聊天界面（消息列表 + 输入）
    │   ├── ChatInput.vue       # 文本输入框（Ctrl+Enter 发送）
    │   ├── HistoryPanel.vue    # 会话历史列表
    │   ├── ResultPanel.vue     # 结果面板（预览 / 代码 / 阶段 标签页）
    │   ├── CodeEditorPanel.vue # 文件树 + Monaco 编辑器
    │   ├── VueReplPreview.vue  # 基于 @vue/repl 的实时 Vue SFC 预览
    │   ├── MonacoEditor.vue    # Monaco 编辑器封装（自定义 Vue 语法高亮）
    │   ├── FileTree.vue        # 项目文件浏览器
    │   ├── FileTreeItem.vue    # 递归文件/文件夹树节点
    │   ├── StageProgress.vue   # 流水线阶段进度展示
    │   ├── StageProgressToggle.vue  # 阶段进度摘要折叠
    │   ├── StageProgressItem.vue    # 单个阶段步骤展示
    │   ├── StageOutputPanel.vue     # 阶段产物与输出面板
    │   ├── StreamingBubble.vue      # 实时生成进度指示器
    │   ├── UserMessageBubble.vue    # 用户消息气泡（含附件预览）
    │   ├── AssistantMessageBubble.vue  # AI 回复消息气泡
    │   └── MarkdownPreview.vue    # Markdown 内容渲染器
    ├── composables/            # Vue 组合式函数
    │   ├── useGeneration.ts    # 核心生成编排逻辑
    │   ├── useChatStageState.ts  # 流式状态与阶段进度管理
    │   ├── useStageProgress.ts  # 进度展示辅助函数
    │   └── useExportHtml.ts    # 从预览 iframe 导出 HTML
    ├── constants/
    │   └── stages.ts           # 流水线阶段名称定义
    ├── router/
    │   └── index.ts            # 路由配置（4 条路由）
    ├── stores/                 # Pinia 状态管理
    │   ├── index.ts            # Pinia 实例创建
    │   ├── chat.ts             # 聊天会话与消息 Store
    │   ├── project.ts          # 项目文件树与编辑 Store
    │   └── preview.ts          # 演练场预览（HTML/CSS/JS）Store
    ├── templates/              # 代码生成项目模板
    │   ├── project-template.ts # 项目脚手架核心逻辑
    │   ├── common.ts           # 公共模板常量（package.json、vite 配置等）
    │   ├── lib-adapter.ts      # 组件库适配器模式与注册机制
    │   ├── element-ui.ts       # Element Plus 适配器
    │   ├── ccui-adapter.ts     # CcUI 适配器
    │   └── ccui-components.ts  # CcUI 组件注册表
    ├── types/
    │   └── index.ts            # TypeScript 接口与类型定义
    ├── utils/
    │   ├── download.ts         # Blob 下载辅助函数
    │   ├── files.ts            # 文件过滤与转换工具
    │   ├── repl-config.ts      # Vue REPL CDN 导入配置
    │   └── repl-files.ts       # Vue REPL 文件规范化
    └── views/                  # 页面级视图组件
        ├── HomeView.vue        # 首页（需求输入、文件上传、组件库选择）
        ├── ChatView.vue        # 工作台（三栏可拖拽布局）
        ├── PreviewView.vue     # 演练场（独立 HTML/CSS/JS 编辑与预览）
        └── SessionPreviewView.vue  # 全屏会话预览
```

## 页面与路由

| 路径 | 视图组件 | 说明 |
|------|----------|------|
| `/` | `HomeView` | 首页 -- 需求输入、文件上传、组件库选择 |
| `/workspace` | `ChatView` | 工作台 -- 三栏可拖拽布局（历史 / 聊天 / 结果） |
| `/playground` | `PreviewView` | 演练场 -- 独立 HTML/CSS/JS 编辑器 + 响应式预览 |
| `/preview?session_id=` | `SessionPreviewView` | 全屏预览 -- 基于 `session_id` 加载会话文件预览 |

## 代码生成流水线

代码生成遵循多阶段流水线，通过 SSE 实时推送进度：

```
附件处理（attachment）
        ↓
需求标准化（requirement）
        ↓
代码生成（generation）
        ↓
UX 优化（optimization）
        ↓
迭代修改（iteration）  ← 仅在后续对话中触发
```

每个阶段会发送 `stage_start`、`stage_progress`、`stage_complete` 事件。失败阶段支持单独重试。

## API 接口

前端通过 REST 接口和 SSE 流式接口与后端 API 服务通信：

### REST 接口

| 方法 | 端点 | 说明 |
|------|------|------|
| `POST` | `/api/sessions` | 创建新会话 |
| `GET` | `/api/sessions` | 获取会话列表（分页） |
| `GET` | `/api/sessions/:id` | 获取会话详情（含消息和文件） |
| `DELETE` | `/api/sessions/:id` | 删除会话 |
| `PATCH` | `/api/sessions/:id` | 更新会话标题 |
| `POST` | `/api/sessions/:id/messages` | 向会话添加消息 |
| `PATCH` | `/api/sessions/:id/files` | 更新会话文件 |
| `POST` | `/api/upload` | 上传文件（multipart/form-data） |
| `POST` | `/api/generate/cancel` | 取消正在执行的生成任务 |

### SSE 流式接口

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/generate/initial/stream` | 首次生成流式推送 |
| `POST` | `/api/generate/iterate/stream` | 迭代生成流式推送 |

### SSE 事件

| 事件 | 说明 |
|------|------|
| `stage_start` | 某个流水线阶段开始 |
| `stage_progress` | 阶段内进度更新 |
| `stage_complete` | 阶段完成（成功 / 失败 / 跳过 / 缓存命中） |
| `done` | 整个生成流程完成 |
| `error` | 生成错误（含失败阶段信息） |
| `cancelled` | 生成已被取消 |

## 组件库模板

项目导出系统采用适配器模式支持不同的 UI 组件库：

| 组件库 | 适配器 | 说明 |
|--------|--------|------|
| **Element Plus** | `element-ui.ts` | 完整 Element Plus 集成 |
| **CcUI** | `ccui-adapter.ts` | 85+ 自定义组件，打包于 `src/ccui/` |

### 新增组件库

1. 在 `src/templates/` 中创建适配器文件，实现 `LibAdapter` 接口：

```typescript
import { registerLib } from './lib-adapter'

registerLib('your-lib-name', {
  getMainTs: () => `import YourLib from 'your-lib'`,
  getExtraSrcChildren: () => [],
  getDependencies: () => ({ 'your-lib': '^1.0.0' }),
})
```

2. 在 `src/templates/` 的入口文件中导入该适配器。

## 状态管理

应用使用三个 Pinia Store 管理状态：

### `chat` Store
管理 AI 聊天会话、消息列表、流式状态和流水线阶段进度。通过 `useChatStageState` 委托阶段追踪。

### `project` Store
管理生成项目的文件树。支持文件选择、内容编辑、新增/删除/重命名操作，区分用户文件（可编辑）和系统文件（只读）。

### `preview` Store
管理独立演练场状态（HTML、CSS、JavaScript）、视口模式和缩放级别。

## 部署

`dist/` 目录包含生产构建产物，可部署到任意静态托管服务：

```bash
npm run build
```

> **注意：** 部署时需配置反向代理，将 `/api/*` 和 `/output/*` 请求转发到后端 API 服务（如 `http://your-backend:8002`）。Nginx 配置示例：
>
> ```nginx
> location /api/ {
>   proxy_pass http://localhost:8002;
> }
> location /output/ {
>   proxy_pass http://localhost:8002;
> }
> ```

## 许可证

Private
