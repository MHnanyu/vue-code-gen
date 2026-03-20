# SSE 流式生成 - 前端实现文档

> 基于 `SSE_STREAMING_DESIGN.md` 需求，针对当前项目架构输出的前端实现方案。

---

## 1. 改动范围总览

| 层级 | 文件 | 改动类型 | 说明 |
|------|------|---------|------|
| 类型定义 | `src/types/index.ts` | 新增 | SSE 事件类型、StageOutput 接口、扩展 ChatMessage |
| API 层 | `src/api/index.ts` | 新增 | SSE 流请求函数、历史文件读取函数 |
| SSE 工具 | `src/api/sse.ts` | **新建** | SSE 解析器、事件分发器、流请求封装 |
| Store | `src/stores/chat.ts` | 修改 | 新增流式生成状态管理、步骤进度状态 |
| Store | `src/stores/generator.ts` | 保留 | 无需改动（legacy store，当前未使用） |
| 组件 | `src/components/ChatPanel.vue` | 修改 | 接入 SSE 流式生成，替换同步 API 调用 |
| 组件 | `src/components/ResultPanel.vue` | 修改 | 支持步骤切换查看中间产物 |
| 组件 | `src/components/StageProgress.vue` | **新建** | 步骤进度条 UI 组件 |
| 组件 | `src/components/MarkdownPreview.vue` | **新建** | Markdown 实时预览组件 |
| 组件 | `src/components/HistoryPanel.vue` | 修改 | 历史消息展示中间产物入口 |
| 视图 | `src/views/ChatView.vue` | 修改 | 传递步骤状态到 ResultPanel |

---

## 2. 类型定义（`src/types/index.ts`）

在现有类型基础上新增以下定义：

```typescript
// ============ SSE 事件类型 ============

interface StageStartEvent {
  stage: number
  stageName: string
  isRetry?: boolean
  timestamp: string
}

interface StageProgressEvent {
  stage: number
  stageName: string
  message: string
  progress?: number
  timestamp: string
}

interface StageCompleteEvent {
  stage: number
  stageName: string
  status: 'success' | 'failed' | 'skipped' | 'cached'
  duration: number | null
  outputType: 'markdown' | 'json' | 'vue' | null
  filePath: string | null
  vueDirPath: string | null
  outputPreview: string | null
  files: ApiFile[] | null
  error: string | null
  timestamp: string
}

interface DoneEvent {
  files: ApiFile[]
  message: string
  stages: Record<string, StageResult>
  failedStep: number | null
  timestamp: string
}

interface ErrorEvent {
  code: number
  message: string
  failedStep: number | null
  stages: Record<string, StageResult>
  timestamp: string
}

// ============ Session Message 扩展 ============

interface StageOutput {
  stage: number
  stageName: string
  status: 'success' | 'failed' | 'skipped' | 'cached'
  duration: number | null
  outputType: 'markdown' | 'json' | 'vue' | null
  filePath: string | null
  vueDirPath: string | null
  error: string | null
}

// 扩展现有 ChatMessage
interface ChatMessage {
  // ... 现有字段保持不变 ...
  stageOutputs?: StageOutput[] | null
}
```

> **与现有类型的兼容性**：`stageOutputs` 为可选字段，不影响现有 `ChatMessage` 的使用。

---

## 3. SSE 工具层（`src/api/sse.ts`）— 新建文件

### 3.1 职责

- 封装 `fetch + ReadableStream` 解析 SSE 协议
- 支持取消请求（AbortController）
- 事件类型分派回调
- 错误处理与重连策略（无需自动重连，SSE 为一次性流）

### 3.2 完整实现

```typescript
import type {
  StageStartEvent,
  StageProgressEvent,
  StageCompleteEvent,
  DoneEvent,
  ErrorEvent,
} from '@/types'

export interface SSECallbacks {
  onStageStart?: (event: StageStartEvent) => void
  onStageProgress?: (event: StageProgressEvent) => void
  onStageComplete?: (event: StageCompleteEvent) => void
  onDone?: (event: DoneEvent) => void
  onError?: (event: ErrorEvent) => void
}

const API_BASE = 'http://localhost:8000'

export async function fetchSSEStream(
  endpoint: string,
  body: Record<string, unknown>,
  callbacks: SSECallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`SSE request failed: ${response.status} ${errorText}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let currentEventType = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEventType = line.slice(7).trim()
        } else if (line.startsWith('data: ')) {
          const dataStr = line.slice(6)
          if (!dataStr.trim()) continue
          try {
            const data = JSON.parse(dataStr)
            dispatchEvent(currentEventType, data, callbacks)
          } catch {
            console.warn('Failed to parse SSE data:', dataStr)
          }
          currentEventType = ''
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

function dispatchEvent(
  eventType: string,
  data: unknown,
  callbacks: SSECallbacks,
): void {
  switch (eventType) {
    case 'stage_start':
      callbacks.onStageStart?.(data as StageStartEvent)
      break
    case 'stage_progress':
      callbacks.onStageProgress?.(data as StageProgressEvent)
      break
    case 'stage_complete':
      callbacks.onStageComplete?.(data as StageCompleteEvent)
      break
    case 'done':
      callbacks.onDone?.(data as DoneEvent)
      break
    case 'error':
      callbacks.onError?.(data as ErrorEvent)
      break
  }
}
```

### 3.3 设计要点

- **不使用 `EventSource`**：`EventSource` 只支持 GET 请求，而 SSE 接口需要 POST 请求体。因此使用 `fetch + ReadableStream`。
- **AbortController 取消**：调用方传入 `signal` 即可取消正在进行的流式请求，取消后 `reader.read()` 抛出 `AbortError`，被 `finally` 块清理。
- **buffer 缓冲**：SSE 数据可能跨 chunk 分割，用 buffer 拼接确保完整解析。
- **无自动重连**：每次生成是一次性流，不需要自动重连。

---

## 4. API 层扩展（`src/api/index.ts`）

### 4.1 新增函数

在现有 `api/index.ts` 中新增以下导出函数：

```typescript
import { fetchSSEStream, type SSECallbacks } from './sse'
import type {
  GenerateInitialRequest,
  GenerateIterateRequest,
  StageOutput,
} from '@/types'

// ============ SSE 流式生成 ============

export function generateInitialStream(
  params: GenerateInitialRequest,
  callbacks: SSECallbacks,
  signal?: AbortSignal,
): Promise<void> {
  return fetchSSEStream(
    '/api/generate/initial/stream',
    params as unknown as Record<string, unknown>,
    callbacks,
    signal,
  )
}

export function generateIterateStream(
  params: GenerateIterateRequest,
  callbacks: SSECallbacks,
  signal?: AbortSignal,
): Promise<void> {
  return fetchSSEStream(
    '/api/generate/iterate/stream',
    params as unknown as Record<string, unknown>,
    callbacks,
    signal,
  )
}

// ============ 历史中间产物读取 ============

export async function fetchStageFile(filePath: string): Promise<string> {
  const response = await fetch(`http://localhost:8000/${filePath}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch stage file: ${response.status}`)
  }
  return response.text()
}

export async function fetchStageJson<T = unknown>(filePath: string): Promise<T> {
  const response = await fetch(`http://localhost:8000/${filePath}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch stage JSON: ${response.status}`)
  }
  return response.json()
}
```

### 4.2 接口地址映射

| 函数 | 方法 | 端点 | 说明 |
|------|------|------|------|
| `generateInitialStream()` | POST (SSE) | `/api/generate/initial/stream` | 流式首次生成 |
| `generateIterateStream()` | POST (SSE) | `/api/generate/iterate/stream` | 流式迭代生成 |
| `fetchStageFile()` | GET | `/{filePath}` | 读取历史 Markdown/文本 |
| `fetchStageJson()` | GET | `/{filePath}` | 读取历史 JSON |

> **保留现有同步接口**：`generateInitial()` 和 `generateIterate()` 不删除，作为降级方案保留。

---

## 5. Store 改造（`src/stores/chat.ts`）

### 5.1 新增状态

```typescript
// ============ 流式生成状态 ============

const isStreaming = ref(false)
const abortController = ref<AbortController | null>(null)

interface StageProgress {
  stage: number
  stageName: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cached'
  duration: number | null
  progressMessage?: string
}

const stageProgresses = ref<StageProgress[]>([])

const currentStagePreview = ref<{
  type: 'markdown' | 'vue' | null
  content: string | null
  files: ApiFile[] | null
}>({ type: null, content: null, files: null })

const activeStageTab = ref<number | null>(null)
```

### 5.2 新增 Computed

```typescript
const currentStreamingStage = computed(() => {
  return stageProgresses.value.find(s => s.status === 'running') ?? null
})

const hasStageOutputs = computed(() => {
  const session = currentSession.value
  if (!session) return false
  return session.messages.some(
    m => m.role === 'assistant' && m.stageOutputs && m.stageOutputs.length > 0,
  )
})
```

### 5.3 新增 Actions

```typescript
function resetStageProgresses(stageNames: string[]): void {
  stageProgresses.value = stageNames.map((name, index) => ({
    stage: index,
    stageName: name,
    status: 'pending' as const,
    duration: null,
  }))
}

function updateStageStatus(
  stage: number,
  status: StageProgress['status'],
  extra?: Partial<StageProgress>,
): void {
  const item = stageProgresses.value.find(s => s.stage === stage)
  if (item) {
    item.status = status
    if (extra) {
      Object.assign(item, extra)
    }
  }
}

function setStagePreview(
  type: 'markdown' | 'vue' | null,
  content: string | null,
  files: ApiFile[] | null,
): void {
  currentStagePreview.value = { type, content, files }
}

function cancelStreaming(): void {
  if (abortController.value) {
    abortController.value.abort()
    abortController.value = null
  }
  isStreaming.value = false
}

function setActiveStageTab(stage: number | null): void {
  activeStageTab.value = stage
}
```

### 5.4 Store 导出汇总

```typescript
return {
  // ... 现有导出保持不变 ...
  isStreaming,
  abortController,
  stageProgresses,
  currentStagePreview,
  activeStageTab,
  currentStreamingStage,
  hasStageOutputs,
  resetStageProgresses,
  updateStageStatus,
  setStagePreview,
  cancelStreaming,
  setActiveStageTab,
}
```

---

## 6. 组件改造

### 6.1 StageProgress.vue — 新建

**路径**：`src/components/StageProgress.vue`

**Props**：

```typescript
interface Props {
  stages: StageProgress[]
  onRetry?: (stage: number) => void
  onCancel?: () => void
}
```

**UI 结构**：

```
┌──────────────────────────────────────────────────────────────┐
│  ● 附件处理 (3.5s)   ● 需求标准化 (12.5s)   ○ 代码生成     │
│      ✓ 完成              ✓ 完成              ⏳ 进行中       │
├──────────────────────────────────────────────────────────────┤
│  [从步骤0重试]  [从步骤1重试]  [从步骤2重试]  [取消生成]      │
└──────────────────────────────────────────────────────────────┘
```

**实现要点**：

- 使用 Element Plus 的 `el-steps` 组件作为基础，自定义图标和状态颜色
- 状态图标映射：
  - `pending` → 灰色圆圈
  - `running` → 蓝色旋转 loading 图标（`el-icon` + `Loading`）
  - `success` → 绿色勾选
  - `cached` → 绿色勾选（带 "缓存" 标签）
  - `failed` → 红色叉号
  - `skipped` → 灰色删除线
- 每个步骤 hover 显示耗时（如 `3.5s`）
- 底部操作栏：
  - "从步骤 N 重试"按钮：仅在 `isStreaming === false` 且对应步骤已完成时显示
  - "取消生成"按钮：仅在 `isStreaming === true` 时显示，调用 `cancelStreaming()`
- 步骤点击事件：设置 `activeStageTab`，触发右侧 ResultPanel 切换到对应步骤的中间产物预览

**步骤名称映射**：

```typescript
const STAGE_NAME_MAP: Record<string, string> = {
  attachment: '附件处理',
  requirement: '需求标准化',
  generation: '代码生成',
  optimization: 'UX 优化',
  iteration: '迭代修改',
}
```

### 6.2 MarkdownPreview.vue — 新建

**路径**：`src/components/MarkdownPreview.vue`

**Props**：

```typescript
interface Props {
  content: string | null
  loading?: boolean
}
```

**实现要点**：

- 轻量级 Markdown 渲染，无需引入额外库
- 使用 CSS `white-space: pre-wrap` + 基础样式渲染标题、列表、代码块
- 或引入 `marked` 库（推荐，已在前端生态广泛使用）：`npm install marked`
- 加载态显示 `el-skeleton`
- 空内容显示占位提示

**推荐方案**（使用 `marked`）：

```vue
<template>
  <div class="markdown-preview">
    <el-skeleton v-if="loading" :rows="8" animated />
    <div v-else-if="content" class="markdown-body" v-html="renderedContent" />
    <el-empty v-else description="暂无预览内容" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  content: string | null
  loading?: boolean
}>()

const renderedContent = computed(() => {
  if (!props.content) return ''
  return marked.parse(props.content)
})
</script>
```

### 6.3 ChatPanel.vue — 核心改造

**改动点**：

#### 6.3.1 替换 `sendMessage()` 中的同步 API 调用

**现有逻辑**（同步）：

```typescript
// 当前代码：同步等待完整响应
const result = isNewSession
  ? await generateInitial({ prompt, sessionId, componentLib, attachments, fromStep })
  : await generateIterate({ prompt, sessionId, files })
```

**改为**（SSE 流式）：

```typescript
const chatStore = useChatStore()
const projectStore = useProjectStore()

const controller = new AbortController()
chatStore.abortController = controller
chatStore.isStreaming = true

const stageNames = isNewSession
  ? ['attachment', 'requirement', 'generation', 'optimization']
  : ['iteration']

chatStore.resetStageProgresses(stageNames)

const callbacks: SSECallbacks = {
  onStageStart(event) {
    chatStore.updateStageStatus(event.stage, 'running', {
      progressMessage: '',
    })
  },

  onStageProgress(event) {
    chatStore.updateStageStatus(event.stage, 'running', {
      progressMessage: event.message,
    })
  },

  onStageComplete(event) {
    chatStore.updateStageStatus(event.stage, event.status, {
      duration: event.duration,
    })

    if (event.outputType === 'markdown' && event.outputPreview) {
      chatStore.setStagePreview('markdown', event.outputPreview, null)
      chatStore.setActiveStageTab(event.stage)
    }

    if (event.outputType === 'vue' && event.files) {
      const filtered = filterSystemFiles(event.files)
      const projectFiles = buildProjectFiles(
        getMainPageContent(filtered),
        getExtraFiles(filtered),
        chatStore.currentSession?.componentLib,
      )
      projectStore.setFiles(projectFiles)
      chatStore.setStagePreview('vue', null, event.files)
      chatStore.setActiveStageTab(event.stage)
    }
  },

  async onDone(event) {
    chatStore.isStreaming = false
    chatStore.abortController = null

    if (event.files) {
      const filtered = filterSystemFiles(event.files)
      const projectFiles = buildProjectFiles(
        getMainPageContent(filtered),
        getExtraFiles(filtered),
        chatStore.currentSession?.componentLib,
      )
      projectStore.setFiles(projectFiles)
      if (chatStore.currentSessionId) {
        await chatStore.updateSessionFiles(chatStore.currentSessionId, filtered)
      }
    }

    chatStore.addMessageLocal(sessionId, {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: event.message,
      timestamp: new Date(),
      stages: event.stages as any,
      failedStep: event.failedStep,
    })

    await chatStore.loadSession(sessionId)
  },

  onError(event) {
    chatStore.isStreaming = false
    chatStore.abortController = null
    ElMessage.error(`生成失败：${event.message}`)
  },
}

if (isNewSession) {
  await generateInitialStream(
    { prompt, sessionId, componentLib, attachments, fromStep },
    callbacks,
    controller.signal,
  )
} else {
  await generateIterateStream(
    { prompt, sessionId, files: projectStore.files },
    callbacks,
    controller.signal,
  )
}
```

#### 6.3.2 替换 `handleRetry()` 中的同步 API 调用

与 `sendMessage()` 类似，改为调用 `generateInitialStream()`，传递 `fromStep` 参数。

#### 6.3.3 加载态 UI 改造

**现有**：简单的 `el-loading` 遮罩 + "AI 正在思考..." 文案。

**改为**：使用 `StageProgress` 组件替代：

```vue
<!-- 替换原有的 loading 区域 -->
<StageProgress
  v-if="chatStore.isStreaming || chatStore.stageProgresses.length > 0"
  :stages="chatStore.stageProgresses"
  :on-retry="handleRetryFromStage"
  :on-cancel="chatStore.cancelStreaming"
/>
```

#### 6.3.4 消息列表改造

在 assistant 消息中，如果 `stageOutputs` 存在，显示步骤摘要条：

```vue
<div v-if="msg.stageOutputs?.length" class="stage-summary">
  <el-tag
    v-for="output in msg.stageOutputs"
    :key="output.stage"
    :type="output.status === 'success' ? 'success' : output.status === 'failed' ? 'danger' : 'info'"
    size="small"
    class="stage-tag"
    @click="handleViewStageOutput(msg, output)"
  >
    {{ STAGE_NAME_MAP[output.stageName] || output.stageName }}
    ({{ output.duration != null ? output.duration.toFixed(1) + 's' : '--' }})
  </el-tag>
</div>
```

点击标签触发查看历史中间产物（见 6.3.5）。

#### 6.3.5 历史中间产物查看

```typescript
async function handleViewStageOutput(
  assistantMsg: ChatMessage,
  output: StageOutput,
) {
  if (!output.filePath) return

  chatStore.setActiveStageTab(output.stage)

  if (output.outputType === 'markdown') {
    const content = await fetchStageFile(output.filePath)
    chatStore.setStagePreview('markdown', content, null)
  } else if (output.outputType === 'vue') {
    const data = await fetchStageJson<ApiFile[]>(output.filePath)
    chatStore.setStagePreview('vue', null, data)
  }
}
```

### 6.4 ResultPanel.vue — 改造

**改动点**：在 Preview / Code 两个 tab 之外，增加步骤中间产物的预览面板。

#### 6.4.1 Tab 结构调整

```
┌─────────────────────────────────────────┐
│ [预览]  [代码]  [步骤产物]               │  ← 新增 "步骤产物" tab
├─────────────────────────────────────────┤
│                                         │
│  （步骤产物面板内容，见下方）              │
│                                         │
└─────────────────────────────────────────┘
```

#### 6.4.2 步骤产物面板内容

当 `chatStore.activeStageTab !== null` 或 `chatStore.isStreaming` 时，在步骤产物面板中显示：

```vue
<template>
  <div v-if="activeStageContent" class="stage-output-panel">
    <!-- 步骤切换 tabs -->
    <el-tabs v-model="activeStageKey" type="border-card">
      <el-tab-pane
        v-for="stage in completedStages"
        :key="stage.stage"
        :label="STAGE_NAME_MAP[stage.stageName] || stage.stageName"
        :name="String(stage.stage)"
      >
        <!-- Markdown 预览 -->
        <MarkdownPreview
          v-if="stage.outputType === 'markdown'"
          :content="stageContentMap[stage.stage]?.content"
          :loading="stage.status === 'running'"
        />

        <!-- Vue 预览：直接注入 VueReplPreview -->
        <VueReplPreview
          v-else-if="stage.outputType === 'vue' && stageContentMap[stage.stage]?.files"
          :files="buildProjectFilesFromStage(stageContentMap[stage.stage].files!)"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
```

#### 6.4.3 Vue 产物注入 Repl

当 SSE 推送 `outputType: 'vue'` 的 `stage_complete` 事件时，直接将 `files` 构建为 `ProjectFile[]` 并注入 `VueReplPreview`：

```typescript
function buildProjectFilesFromStage(files: ApiFile[]): ProjectFile[] {
  const mainFile = files.find(f => f.name === 'MainPage.vue')
  const extraFiles = files.filter(f => f.name !== 'MainPage.vue')
  return buildProjectFiles(
    mainFile?.content || '',
    extraFiles.length > 0 ? extraFiles : undefined,
    chatStore.currentSession?.componentLib,
  )
}
```

> **注意**：`VueReplPreview` 的 `files` prop 变化时，组件内部 `watch` 会自动调用 `syncFilesToRepl()` 更新预览，无需额外处理。

### 6.5 HistoryPanel.vue — 小幅改造

在会话卡片中，如果最新的 assistant 消息包含 `stageOutputs`，显示步骤摘要：

```vue
<div v-if="lastAssistantStageOutputs.length" class="stage-tags">
  <el-tag
    v-for="output in lastAssistantStageOutputs"
    :key="output.stage"
    size="small"
    :type="output.status === 'success' ? 'success' : 'danger'"
  >
    {{ STAGE_NAME_MAP[output.stageName] || output.stageName }}
  </el-tag>
</div>
```

```typescript
const lastAssistantStageOutputs = computed(() => {
  const session = /* 当前选中 session */
  const lastAssistant = [...(session?.messages || [])]
    .reverse()
    .find(m => m.role === 'assistant')
  return lastAssistant?.stageOutputs || []
})
```

### 6.6 ChatView.vue — 小幅改造

无需大改，确保 `chatStore` 的 `stageProgresses` 和 `currentStagePreview` 在 `ChatPanel` 与 `ResultPanel` 之间正确传递即可。当前 `ChatView` 已通过 store 共享状态，组件间无需额外 props。

---

## 7. 数据流时序图

### 7.1 首次生成（SSE 流式）

```
用户点击"生成"
  │
  ├─ ChatPanel.sendMessage()
  │   ├─ chatStore.addMessageLocal() — 添加用户消息
  │   ├─ chatStore.resetStageProgresses(['attachment','requirement','generation','optimization'])
  │   ├─ chatStore.isStreaming = true
  │   └─ generateInitialStream(params, callbacks, signal)
  │       │
  │       ├─ onStageStart(0, 'attachment')
  │       │   └─ chatStore.updateStageStatus(0, 'running')
  │       │
  │       ├─ onStageComplete(0, 'attachment', outputPreview)
  │       │   ├─ chatStore.updateStageStatus(0, 'success', {duration: 3.5})
  │       │   ├─ chatStore.setStagePreview('markdown', outputPreview)
  │       │   └─ chatStore.setActiveStageTab(0)
  │       │
  │       ├─ onStageStart(1, 'requirement')
  │       │   └─ chatStore.updateStageStatus(1, 'running')
  │       │
  │       ├─ onStageComplete(1, 'requirement', outputPreview)
  │       │   ├─ chatStore.updateStageStatus(1, 'success', {duration: 12.5})
  │       │   ├─ chatStore.setStagePreview('markdown', outputPreview)
  │       │   └─ chatStore.setActiveStageTab(1)
  │       │
  │       ├─ onStageStart(2, 'generation')
  │       │   └─ chatStore.updateStageStatus(2, 'running')
  │       │
  │       ├─ onStageComplete(2, 'generation', files)
  │       │   ├─ chatStore.updateStageStatus(2, 'success', {duration: 45.3})
  │       │   ├─ projectStore.setFiles(buildProjectFiles(files))
  │       │   ├─ chatStore.setStagePreview('vue', null, files)
  │       │   └─ chatStore.setActiveStageTab(2)
  │       │       └─ ResultPanel 自动更新 VueReplPreview
  │       │
  │       └─ onDone({files, message, stages})
  │           ├─ chatStore.isStreaming = false
  │           ├─ projectStore.setFiles(buildProjectFiles(files))
  │           ├─ chatStore.addMessageLocal(assistant message with stages)
  │           └─ chatStore.loadSession(sessionId)
  │               └─ 后端已写入 stageOutputs 到 Message
  │
  ├─ StageProgress 组件（响应式）
  │   └─ watch chatStore.stageProgresses → 渲染进度条
  │
  └─ ResultPanel 步骤产物面板（响应式）
      └─ watch chatStore.activeStageTab + currentStagePreview → 渲染中间产物
```

### 7.2 历史中间产物查看

```
用户点击历史消息中的步骤标签
  │
  ├─ ChatPanel.handleViewStageOutput(msg, stageOutput)
  │   ├─ chatStore.setActiveStageTab(stageOutput.stage)
  │   ├─ if markdown: fetchStageFile(filePath) → chatStore.setStagePreview('markdown', content)
  │   └─ if vue: fetchStageJson(filePath) → chatStore.setStagePreview('vue', null, files)
  │
  └─ ResultPanel 步骤产物面板
      └─ watch chatStore.currentStagePreview → 渲染对应内容
```

---

## 8. 新增依赖

```bash
npm install marked
```

| 包 | 用途 | 必要性 |
|----|------|--------|
| `marked` | Markdown 渲染 | 必须，用于渲染步骤0/1的 Markdown 产出 |

> 无需其他额外依赖。`@vue/repl`、Element Plus、Vue Router、Pinia 等均为现有依赖。

---

## 9. Vite 代理配置

当前 `vite.config.ts` 已有或需确认的代理配置（确保 SSE 流不被 Nginx/Vite 缓冲）：

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/output': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

**注意**：Vite dev server 默认会缓冲响应，需确认 SSE 流能正常透传。如遇问题，在代理配置中添加：

```typescript
'/api/generate': {
  target: 'http://localhost:8000',
  changeOrigin: true,
  // 禁用代理缓冲，确保 SSE 流实时推送
  configure: (proxy) => {
    proxy.on('proxyRes', (proxyRes) => {
      proxyRes.headers['cache-control'] = 'no-cache'
      proxyRes.headers['x-accel-buffering'] = 'no'
    })
  },
},
```

---

## 10. 错误处理策略

| 场景 | 前端行为 |
|------|---------|
| SSE 连接失败（网络错误） | `fetchSSEStream` 抛出异常 → `catch` 块中 `ElMessage.error()`，`isStreaming = false` |
| 单步骤失败（`stage_complete(status=failed)`） | 进度条标记红色叉号，后续 `error` 事件弹出错误消息，显示"从失败步骤重试"按钮 |
| 整体失败（`error` 事件） | 弹出错误消息，进度条停在失败步骤，显示重试按钮 |
| 用户取消（AbortController） | `catch(AbortError)` 静默处理，`isStreaming = false`，进度条保持当前状态 |
| 历史文件 404 | `fetchStageFile/Json` 抛出异常 → `ElMessage.warning('文件不存在')` |
| Markdown 解析失败 | `marked.parse()` 降级显示原始文本 |

---

## 11. 实现计划（分阶段）

### Phase 1：基础框架（优先）

1. 新建 `src/types/index.ts` 中的 SSE 事件类型和 StageOutput 接口
2. 新建 `src/api/sse.ts` — SSE 解析器和流请求封装
3. 在 `src/api/index.ts` 中新增 `generateInitialStream`、`generateIterateStream`、`fetchStageFile`、`fetchStageJson`

### Phase 2：Store + 进度 UI

4. 扩展 `src/stores/chat.ts` — 新增流式状态、步骤进度、取消逻辑
5. 新建 `src/components/StageProgress.vue` — 步骤进度条组件
6. 改造 `ChatPanel.vue` — 替换同步 API 调用为 SSE 流式调用

### Phase 3：中间产物预览

7. `npm install marked`
8. 新建 `src/components/MarkdownPreview.vue`
9. 改造 `ResultPanel.vue` — 新增"步骤产物"tab，集成 Markdown 和 Vue 预览

### Phase 4：历史查看 + 收尾

10. 改造 `ChatPanel.vue` — 历史消息中的步骤标签和点击查看逻辑
11. 改造 `HistoryPanel.vue` — 会话卡片显示步骤摘要
12. 配置 Vite 代理（如有需要）
13. 端到端测试（需要后端 SSE 接口就绪）

---

## 12. 关键注意事项

### 12.1 `@vue/repl` 动态更新

`VueReplPreview` 组件内部已通过 `watch(files, ...)` 实现自动同步，SSE 推送的 `files` 直接赋值到 `projectStore.files` 后，`ResultPanel` 传递给 `VueReplPreview` 的 `files` prop 变化会自动触发 repl 更新。**无需手动调用 `repl.setFiles()`**。

### 12.2 AbortController 生命周期

- 创建时机：`sendMessage()` 调用时
- 销毁时机：`onDone` / `onError` 回调中置 `null`，或 `cancelStreaming()` 中 `abort()`
- 避免泄漏：组件 `onUnmounted` 中调用 `cancelStreaming()`，确保离开页面时中断流

```typescript
onUnmounted(() => {
  chatStore.cancelStreaming()
})
```

### 12.3 系统文件过滤

SSE 推送的 `files` 数组可能包含系统文件（与现有同步接口一致），需要过滤：

```typescript
const SYSTEM_PATHS = [
  '/src/main.ts', '/src/App.vue', '/src/style.css',
  '/public/index.html', '/package.json', '/vite.config.ts',
]

function filterSystemFiles(files: ApiFile[]): ApiFile[] {
  return files.filter(f => !SYSTEM_PATHS.includes(f.path))
}
```

### 12.4 `buildProjectFiles` 调用时机

- **SSE 实时推送**：`stage_complete(outputType='vue')` 时立即调用，用户可在生成过程中预览
- **`done` 事件**：再次调用，确保最终结果完整
- **历史查看**：`fetchStageJson()` 获取文件后调用

### 12.5 向后兼容

- 现有同步接口 `generateInitial()` / `generateIterate()` 保留不删
- `ChatMessage.stageOutputs` 为可选字段，旧数据不受影响
- 如果后端 SSE 接口未就绪，前端可回退到同步接口（建议在 `ChatPanel` 中通过配置项切换）
