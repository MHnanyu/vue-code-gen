# Vue3 Page Generator

基于 AI 的 Vue3 页面代码生成器。用户通过自然语言描述需求，系统智能生成可运行的 Vue3 项目代码。

## 功能特性

- **自然语言生成代码** - 输入需求描述，AI 自动生成完整的 Vue3 项目代码
- **实时预览** - 生成的代码即时预览，所见即所得
- **代码编辑** - 内置 Monaco Editor，支持语法高亮和代码编辑
- **会话管理** - 支持多轮对话，历史记录持久化
- **多组件库支持** - 支持 Element Plus、AUI 等组件库

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3.5 + TypeScript 5.9 |
| 构建 | Vite 7.3 |
| 状态管理 | Pinia 3.0 |
| 路由 | Vue Router 4.6 |
| UI 组件 | Element Plus 2.9 |
| 代码编辑 | Monaco Editor 0.55 |
| 工具库 | @vueuse/core |

## 项目结构

```
src/
├── api/              # API 接口封装
├── components/       # 公共组件
│   ├── ChatPanel.vue       # AI 对话面板
│   ├── FileTree.vue        # 文件树组件
│   ├── HistoryPanel.vue    # 历史记录面板
│   ├── MonacoEditor.vue    # 代码编辑器
│   ├── ResultPanel.vue     # 结果展示面板
│   └── VueRepl.vue         # Vue 在线运行环境
├── preview/          # 预览相关
├── router/           # 路由配置
├── stores/           # Pinia 状态管理
│   ├── chat.ts             # 对话状态
│   ├── project.ts          # 项目文件状态
│   └── preview.ts          # 预览状态
├── templates/        # 项目模板
├── types/            # TypeScript 类型定义
└── views/            # 页面视图
    ├── HomeView.vue        # 首页（需求输入）
    ├── ChatView.vue        # AI 对话页
    ├── PreviewView.vue     # HTML 预览页
    └── GeneratorView.vue   # 代码生成页
```

## 快速开始

### 前端

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 后端

后端 API 项目位于 `vue-code-gen-api`，启动方式：

```bash
conda activate python310
python -m uvicorn app.main:app --reload --port 8000
```

## 页面流程

```
首页 (/)          输入需求描述
    ↓
对话页 (/chat)    AI 对话生成代码，实时预览
    ↓
预览页            独立预览生成的页面
```

## 相关项目

- [vue-code-gen-api](../vue-code-gen-api) - 后端 API 服务（Python + FastAPI）

## License

MIT
