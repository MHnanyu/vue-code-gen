# SSE 长连接流式生成 - 需求设计文档

## 1. 背景与目标

### 现状问题

当前 `/api/generate/initial` 和 `/api/generate/iterate` 均为同步请求-响应模式：
- 整个流程（多步骤串行）执行完毕后才一次性返回结果
- 前端在等待期间无法感知进度，用户体验差
- 每个步骤的中间产出（MD、JSON、Vue）无法实时预览
- 步骤失败后重试只能从失败步骤开始，无法回溯到更早的步骤

### 目标

1. **流式推送**：将 `/generate/initial` 和 `/generate/iterate` 改为 SSE（Server-Sent Events）长连接，每完成一个步骤立即推送到前端
2. **中间结果预览**：每个步骤的产出（MD / JSON / Vue）实时推送给前端，前端可即时预览
3. **历史结果保留**：多轮对话中，每轮的中间结果和最终结果均可查看
4. **灵活重试**：最后一次对话可从任意步骤重新生成（合并现有 `fromStep` 重试逻辑）

---

## 2. 技术方案：SSE（Server-Sent Events）

选择 SSE 而非 WebSocket 的理由：
- 单向推送（服务端→客户端）足够满足需求，不需要双向通信
- 浏览器原生支持 `EventSource` / `fetch + ReadableStream`
- FastAPI 原生支持 `StreamingResponse`，实现简单
- 自动重连、文本协议、天然适合步骤式推送
- 与现有 HTTP 生态兼容，无需额外协议层

---

## 3. 中间产物存储策略：文件路径而非内嵌内容

### 设计决策

中间产物（MD、JSON、Vue 文件内容）**存储到磁盘文件**，Session Message 中仅保存**文件相对路径**，不内嵌完整内容。

### 理由

| 对比项 | 内嵌内容到 Message | 存文件路径到 Message |
|-------|-------------------|-------------------|
| MongoDB 文档大小 | 多轮对话后极易撑爆 16MB 限制 | 每条 StageOutput 仅存路径，几十字节 |
| 读取性能 | 大文档查询慢 | 轻量 |
| 已有机制 | 无 | 项目已有 `output/{sessionId}/step{N}_*.{ext}` 缓存机制，零额外成本 |
| 实际使用频率 | 历史中间产物仅偶尔查看 | 按需加载，不浪费资源 |
| 重试依赖 | - | 缓存文件正是 `fromStep` 重试的数据源，天然复用 |

### 文件命名规则

每轮对话的产出按 **messageId** 隔离到独立目录，文件与消息天然一一对应：

```
output/{sessionId}/
├── {messageId-A}/                                 # 第1轮 assistant 消息
│   ├── step0_final_prompt.md                      # 步骤0：附件处理后的完整 prompt
│   ├── step1_requirement.md                       # 步骤1：标准化需求文档
│   ├── step2_generation.json                      # 步骤2：代码生成结果
│   ├── step2_generation_vue/                      # 步骤2：Vue 文件
│   │   └── MainPage.vue
│   └── step3_optimization.json                    # 步骤3：UX 优化结果（仅 CcUI）
│
├── {messageId-B}/                                 # 第2轮 assistant 消息（iterate）
│   ├── step0_iteration.json                       # 迭代生成结果
│   └── step0_iteration_vue/                       # 迭代 Vue 文件
│       └── MainPage.vue
│
└── {messageId-C}/                                 # 第3轮（重试 initial）
    ├── step0_final_prompt.md                      # 步骤0：从缓存复制
    ├── step1_requirement.md                       # 步骤1：重新生成
    ├── step2_generation.json                      # 步骤2：重新生成
    └── step2_generation_vue/
        └── MainPage.vue
```

规则说明：
- 每次生成/迭代/重试时，后端**先生成 messageId**（UUID），再以此为目录名写入产出文件
- 目录内的文件命名统一为 `step{N}_{stageName}.{ext}`，与现有命名风格一致
- Vue 文件目录：`step{N}_{stageName}_vue/`
- **重试场景**：生成新的 messageId，产生新目录，不覆盖旧文件，历史完整可追溯
- 前端通过 `message.id`（即 messageId）即可定位该轮所有产出文件，无需维护轮次序号映射

### 新增静态文件服务

后端挂载 `output` 目录为静态文件，供前端按路径读取：

```python
# app/main.py
app.mount("/output", StaticFiles(directory="output"), name="output")
```

前端通过 `GET /output/{sessionId}/{messageId}/step1_requirement.md` 获取文件内容。

---

## 4. 新增 SSE 接口设计

### 4.1 `POST /api/generate/initial/stream`

与 `/api/generate/initial` 请求参数完全一致，响应改为 SSE 流。

**请求体**（同现有 `GenerateInitialRequest`）

```json
{
  "prompt": "生成一个登录页面",
  "sessionId": "会话ID，可选",
  "componentLib": "ElementUI",
  "attachments": [],
  "fromStep": null
}
```

**响应**：`Content-Type: text/event-stream`

SSE 事件流格式如下，每个事件用 `event:` 指定事件类型，`data:` 携带 JSON 数据：

```
event: stage_start
data: {"stage": 0, "stageName": "attachment", "timestamp": "2026-03-20T10:00:00Z"}

event: stage_progress
data: {"stage": 0, "stageName": "attachment", "message": "正在分析图片 1/2...", "timestamp": "..."}

event: stage_complete
data: {"stage": 0, "stageName": "attachment", "status": "success", "duration": 3.5, "outputType": "markdown", "filePath": "output/{sessionId}/{messageId}/step0_final_prompt.md", "outputPreview": "用户需求：\n生成一个登录页面..."}

event: stage_start
data: {"stage": 1, "stageName": "requirement", "timestamp": "..."}

event: stage_complete
data: {"stage": 1, "stageName": "requirement", "status": "success", "duration": 12.5, "outputType": "markdown", "filePath": "output/{sessionId}/{messageId}/step1_requirement.md", "outputPreview": "# 标准化需求文档\n..."}

event: stage_start
data: {"stage": 2, "stageName": "generation", "timestamp": "..."}

event: stage_complete
data: {"stage": 2, "stageName": "generation", "status": "success", "duration": 45.3, "outputType": "vue", "filePath": "output/{sessionId}/{messageId}/step2_generation.json", "vueDirPath": "output/{sessionId}/{messageId}/step2_generation_vue", "files": [{"id": "main-page", "name": "MainPage.vue", "path": "/src/MainPage.vue", "content": "..."}]}

event: stage_start
data: {"stage": 3, "stageName": "optimization", "timestamp": "..."}

event: stage_complete
data: {"stage": 3, "stageName": "optimization", "status": "skipped", "duration": 0, "outputType": null, "filePath": null}

event: done
data: {"files": [{"id": "main-page", "name": "MainPage.vue", "path": "/src/MainPage.vue", "content": "..."}], "message": "生成完成", "stages": {...}, "failedStep": null}

event: error
data: {"code": 1003, "message": "AI服务调用失败", "failedStep": 2, "stages": {...}}
```

### 4.2 `POST /api/generate/iterate/stream`

与 `/api/generate/iterate` 请求参数完全一致，响应改为 SSE 流。

**请求体**（同现有 `GenerateIterateRequest`）

```json
{
  "prompt": "给登录页面添加一个注册按钮",
  "sessionId": "会话ID，可选",
  "files": [{"id": "main-page", "name": "MainPage.vue", "path": "/src/MainPage.vue", "content": "..."}]
}
```

**响应**：`Content-Type: text/event-stream`

```
event: stage_start
data: {"stage": 0, "stageName": "iteration", "timestamp": "..."}

event: stage_complete
data: {"stage": 0, "stageName": "iteration", "status": "success", "duration": 15.2, "outputType": "vue", "filePath": "output/{sessionId}/{messageId}/step0_iteration.json", "vueDirPath": "output/{sessionId}/{messageId}/step0_iteration_vue", "files": [{"id": "main-page", "name": "MainPage.vue", "path": "/src/MainPage.vue", "content": "..."}]}

event: done
data: {"files": [...], "message": "已为您添加注册按钮", "stages": {...}, "failedStep": null}
```

### 4.3 SSE 事件类型总览

| 事件类型 | 说明 | 触发时机 |
|---------|------|---------|
| `stage_start` | 步骤开始 | 每个步骤执行前 |
| `stage_progress` | 步骤进度（可选） | 步骤内的子任务完成时（如图片分析中每张图完成） |
| `stage_complete` | 步骤完成 | 步骤执行完毕（成功/失败/跳过） |
| `done` | 整体完成 | 所有步骤执行完毕 |
| `error` | 整体失败 | 不可恢复的错误发生时 |

---

## 5. SSE 事件数据结构详细定义

### 5.1 `stage_start`

```typescript
interface StageStartEvent {
  stage: number          // 步骤编号：0=附件处理, 1=需求标准化, 2=代码生成, 3=UX优化
  stageName: string      // 步骤名称
  isRetry: boolean       // 是否为重试步骤
  timestamp: string      // ISO 8601 时间戳
}
```

### 5.2 `stage_progress`

```typescript
interface StageProgressEvent {
  stage: number
  stageName: string
  message: string        // 进度描述，如 "正在分析图片 2/3..."
  progress?: number      // 可选，0-100 的进度百分比
  timestamp: string
}
```

### 5.3 `stage_complete`

```typescript
interface StageCompleteEvent {
  stage: number
  stageName: string
  status: "success" | "failed" | "skipped" | "cached"
  duration: number | null // 耗时（秒）
  outputType: "markdown" | "json" | "vue" | null  // 产出类型
  filePath: string | null       // 产出文件的相对路径（如 "output/{sessionId}/{messageId}/step1_requirement.md"）
  vueDirPath: string | null     // Vue 文件目录的相对路径（仅 outputType="vue" 时有值）
  outputPreview: string | null  // 产出预览文本（截断前500字符，用于前端即时展示）
  files: GeneratedFile[] | null // Vue 文件列表（仅 outputType="vue" 时有值，SSE 实时推送用）
  error: string | null          // 错误信息（仅 status=failed 时）
  timestamp: string
}
```

**设计说明**：
- `filePath` / `vueDirPath`：磁盘文件路径，路径中包含 messageId，与 Message.id 一一对应
- `outputPreview`：截断预览，前端可立即展示而无需再发请求
- `files`：仅在 SSE 实时推送时携带完整 Vue 内容（用于立即注入 @vue/repl），历史查看时通过 `filePath` 读取

### 5.4 `done`

```typescript
interface DoneEvent {
  files: GeneratedFile[]     // 最终文件列表
  message: string            // AI 消息
  stages: Record<string, StageResult>  // 所有步骤状态汇总
  failedStep: number | null  // 失败步骤（null 表示全部成功）
  timestamp: string
}
```

### 5.5 `error`

```typescript
interface ErrorEvent {
  code: number               // 错误码（同 ErrorCode）
  message: string            // 错误描述
  failedStep: number | null  // 失败步骤
  stages: Record<string, StageResult>  // 已完成的步骤状态
  timestamp: string
}
```

---

## 6. 前端预览方案

### 6.1 各步骤产出类型与预览方式

| 步骤 | 产出类型 | SSE 实时预览 | 历史查看 |
|------|---------|-------------|---------|
| 步骤0 附件处理 | `markdown` | 用 `outputPreview` 即时渲染 Markdown | `GET {filePath}` 获取完整内容 |
| 步骤1 需求标准化 | `markdown` | 用 `outputPreview` 即时渲染 Markdown | `GET {filePath}` 获取完整内容 |
| 步骤2 代码生成 | `vue` | 用 `files` 注入 `@vue/repl` | `GET {filePath}` 获取 JSON，解析 files 注入 repl |
| 步骤3 UX优化 | `vue` | 用 `files` 替换 `@vue/repl` 文件 | `GET {filePath}` 获取 JSON，解析 files 注入 repl |
| 迭代修改 | `vue` | 用 `files` 替换 `@vue/repl` 文件 | `GET {filePath}` 获取 JSON，解析 files 注入 repl |

### 6.2 Vue 预览集成方案

步骤2/步骤3 产出 Vue 文件时，前端通过 `@vue/repl` 的 API 动态注入文件：

```typescript
// SSE 实时推送时：直接用 event.files 注入
function onStageComplete(event: StageCompleteEvent) {
  if (event.outputType === 'vue' && event.files) {
    const projectFiles = buildProjectFiles(event.files)
    repl.value.setFiles(projectFiles)
  }
}

// 历史查看时：通过 filePath 读取 JSON 再解析
async function loadHistoricalVueFiles(filePath: string) {
  const res = await fetch(`/${filePath}`)
  const data = await res.json()
  const files = data.files || data
  const projectFiles = buildProjectFiles(files)
  repl.value.setFiles(projectFiles)
}
```

### 6.3 Markdown 预览集成方案

```typescript
// SSE 实时推送时：直接用 outputPreview 渲染
function onStageComplete(event: StageCompleteEvent) {
  if (event.outputType === 'markdown' && event.outputPreview) {
    markdownPreview.value = event.outputPreview
  }
}

// 历史查看时：通过 filePath 获取完整内容
async function loadHistoricalMarkdown(filePath: string) {
  const res = await fetch(`/${filePath}`)
  markdownPreview.value = await res.text()
}
```

---

## 7. Session Message Schema 变更

### 7.1 `StageOutput` 结构（存路径，不存内容）

```typescript
interface StageOutput {
  stage: number
  stageName: string
  status: "success" | "failed" | "skipped" | "cached"
  duration: number | null
  outputType: "markdown" | "json" | "vue" | null
  filePath: string | null       // 产出文件相对路径
  vueDirPath: string | null     // Vue 文件目录相对路径（仅 outputType="vue"）
  error: string | null
}
```

### 7.2 Message 扩展

```typescript
interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  failedStep: number | null
  stages: Record<string, StageResult> | null
  stageOutputs: StageOutput[] | null   // 新增：每步产出元数据（路径）
  timestamp: string
}
```

### 7.3 initial 消息示例

```json
{
  "id": "msg-xxx",
  "role": "assistant",
  "content": "生成完成",
  "failedStep": null,
  "stages": {
    "attachment": { "status": "success", "duration": 3.5 },
    "requirement": { "status": "success", "duration": 12.5 },
    "generation": { "status": "success", "duration": 45.3 }
  },
  "stageOutputs": [
    {
      "stage": 0,
      "stageName": "attachment",
      "status": "success",
      "duration": 3.5,
      "outputType": "markdown",
      "filePath": "output/{sessionId}/{messageId}/step0_final_prompt.md",
      "vueDirPath": null,
      "error": null
    },
    {
      "stage": 1,
      "stageName": "requirement",
      "status": "success",
      "duration": 12.5,
      "outputType": "markdown",
      "filePath": "output/{sessionId}/{messageId}/step1_requirement.md",
      "vueDirPath": null,
      "error": null
    },
    {
      "stage": 2,
      "stageName": "generation",
      "status": "success",
      "duration": 45.3,
      "outputType": "vue",
      "filePath": "output/{sessionId}/{messageId}/step2_generation.json",
      "vueDirPath": "output/{sessionId}/{messageId}/step2_generation_vue",
      "error": null
    }
  ],
  "timestamp": "2026-03-20T10:05:00Z"
}
```

### 7.4 迭代消息示例

```json
{
  "role": "assistant",
  "content": "已为您添加注册按钮",
  "failedStep": null,
  "stages": {
    "iteration": { "status": "success", "duration": 15.2 }
  },
  "stageOutputs": [
    {
      "stage": 0,
      "stageName": "iteration",
      "status": "success",
      "duration": 15.2,
      "outputType": "vue",
      "filePath": "output/{sessionId}/{messageId}/step0_iteration.json",
      "vueDirPath": "output/{sessionId}/{messageId}/step0_iteration_vue",
      "error": null
    }
  ]
}
```

---

## 8. 重试机制（合并现有 fromStep）

### 8.1 请求方式

SSE 接口同样支持 `fromStep` 参数，语义与现有接口一致：

```json
{
  "prompt": "原始需求",
  "sessionId": "xxx-xxx",
  "componentLib": "ElementUI",
  "fromStep": 1
}
```

### 8.2 SSE 流中的重试行为

- `fromStep` 之前的步骤：发送 `stage_complete` 事件，`status: "cached"`，`filePath` 指向已有缓存文件
- `fromStep` 及之后的步骤：正常发送 `stage_start` → `stage_complete`，写入新的 messageId 目录

```
event: stage_complete
data: {"stage": 0, "stageName": "attachment", "status": "cached", "duration": null, "outputType": "markdown", "filePath": "output/{sessionId}/{messageId}/step0_final_prompt.md", "outputPreview": "..."}

event: stage_start
data: {"stage": 1, "stageName": "requirement", "isRetry": true, "timestamp": "..."}

event: stage_complete
data: {"stage": 1, "stageName": "requirement", "status": "success", "duration": 12.5, "filePath": "output/{sessionId}/{messageId}/step1_requirement.md", ...}
```

### 8.3 重试步骤扩展

`fromStep` 可选值保持不变：`0`、`1`、`2`、`3`。前端可从任意步骤重试，不仅限于失败步骤。

---

## 9. 后端实现方案

### 9.1 FastAPI StreamingResponse

使用 `StreamingResponse` + async generator 实现 SSE：

```python
from fastapi.responses import StreamingResponse
import json

@router.post("/generate/initial/stream")
async def generate_initial_stream(body: GenerateInitialRequest):
    message_id = str(uuid4())  # 生成 messageId，作为本轮产出目录名

    async def event_stream():
        # 步骤0
        yield sse_event("stage_start", {"stage": 0, "stageName": "attachment", ...})
        
        final_prompt = await process_attachments(body)
        yield sse_event("stage_complete", {
            "stage": 0, "status": "success", "outputType": "markdown",
            "filePath": f"output/{body.sessionId}/{message_id}/step0_final_prompt.md",
            "outputPreview": final_prompt[:500], ...
        })
        
        # 步骤1
        yield sse_event("stage_start", {"stage": 1, "stageName": "requirement", ...})
        requirement_doc = await standardize_requirement(final_prompt)
        yield sse_event("stage_complete", {
            "stage": 1, "status": "success", "outputType": "markdown",
            "filePath": f"output/{body.sessionId}/{message_id}/step1_requirement.md",
            "outputPreview": requirement_doc[:500], ...
        })
        
        # 步骤2
        yield sse_event("stage_start", {"stage": 2, "stageName": "generation", ...})
        files = await generate_code(requirement_doc)
        yield sse_event("stage_complete", {
            "stage": 2, "outputType": "vue",
            "filePath": f"output/{body.sessionId}/{message_id}/step2_generation.json",
            "vueDirPath": f"output/{body.sessionId}/{message_id}/step2_generation_vue",
            "files": files, ...
        })
        
        # 步骤3（仅 CcUI）
        # ...
        
        # 完成
        yield sse_event("done", {"files": [...], "message": "完成", ...})
    
    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

def sse_event(event_type: str, data: dict) -> str:
    return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
```

### 9.2 现有接口兼容

**保留原有同步接口**，不做删除。SSE 接口为新增的 `/stream` 后缀版本：

| 原接口 | 新 SSE 接口 | 关系 |
|-------|------------|------|
| `POST /api/generate/initial` | `POST /api/generate/initial/stream` | 新增，并行存在 |
| `POST /api/generate/iterate` | `POST /api/generate/iterate/stream` | 新增，并行存在 |

前端可自行选择使用同步接口或 SSE 接口。

### 9.3 错误处理

SSE 流中的错误处理策略：

| 场景 | 行为 |
|------|------|
| 单步骤失败（如步骤2 AI 调用超时） | 发送 `stage_complete(status=failed)` + `error` 事件，流关闭 |
| 不可恢复错误（如数据库断连） | 直接发送 `error` 事件，流关闭 |
| 客户端断开连接 | 后端 async generator 自动取消，资源释放 |

### 9.4 数据库写入时机

`done` 事件发送后，后端将 assistant 消息（含 `stageOutputs` 路径元数据）写入 session 的 messages 数组。与现有行为一致，写入时机从"返回前"变为"done 事件发送后"。

---

## 10. 前端对接指南

### 10.1 使用 fetch + ReadableStream 消费 SSE

```typescript
async function generateInitialStream(params: GenerateInitialRequest) {
  const response = await fetch('/api/generate/initial/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    
    let currentEvent = ''
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7)
      } else if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        handleSSEEvent(currentEvent, data)
      }
    }
  }
}

function handleSSEEvent(event: string, data: any) {
  switch (event) {
    case 'stage_start':
      updateProgressUI(data.stage, 'running')
      break
    case 'stage_complete':
      if (data.outputType === 'markdown') {
        // 实时预览：直接用 outputPreview
        renderMarkdownPreview(data.outputPreview)
      } else if (data.outputType === 'vue' && data.files) {
        // 实时预览：直接用 files 注入 repl
        updateReplPreview(data.files)
      }
      updateProgressUI(data.stage, data.status)
      break
    case 'done':
      onGenerationDone(data)
      break
    case 'error':
      onError(data)
      break
  }
}
```

### 10.2 历史中间结果查看

```typescript
// 从 session messages 获取历史中间产出
async function viewHistoricalStage(
  assistantMsg: Message,
  stage: number
) {
  const output = assistantMsg?.stageOutputs?.find(s => s.stage === stage)
  if (!output?.filePath) return

  if (output.outputType === "markdown") {
    const res = await fetch(`/${output.filePath}`)
    const content = await res.text()
    renderMarkdownPreview(content)
  } else if (output.outputType === "vue") {
    const res = await fetch(`/${output.filePath}`)
    const data = await res.json()
    const files = data.files || data
    updateReplPreview(files)
  }
}
```

### 10.3 进度条 UI 示意

```
┌─────────────────────────────────────────────────────┐
│ ● 附件处理 (3.5s)  ● 需求标准化 (12.5s)  ○ 代码生成   │
│     ✓ 完成              ✓ 完成             ⏳ 进行中    │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │  [预览区] - Markdown 渲染 / @vue/repl 预览      │ │
│ │                                                   │ │
│ │  # 标准化需求文档                                 │ │
│ │  ## 功能需求                                      │ │
│ │  ...                                              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [从步骤0重试] [从步骤1重试] [从步骤2重试] [取消]      │
└─────────────────────────────────────────────────────┘
```

### 10.4 多轮对话历史查看 UI 示意

```
┌─────────────────────────────────────────────────────┐
│ 📋 第1轮对话                                        │
│   用户: 生成一个登录页面                               │
│   助手: 生成完成                                     │
│   步骤: [附件处理 ✓] [需求标准化 ✓] [代码生成 ✓]       │
│   ▸ 查看中间结果: [需求文档] [生成代码]                  │
├─────────────────────────────────────────────────────┤
│ 📋 第2轮对话 (当前)                                   │
│   用户: 给登录页面添加一个注册按钮                       │
│   助手: 已为您添加注册按钮                              │
│   步骤: [迭代修改 ✓]                                  │
│   ▸ 查看中间结果: [修改后代码]                          │
│   [从步骤0重试] [取消]                                │
└─────────────────────────────────────────────────────┘
```

---

## 11. 文件路径汇总

### 11.1 initial 生成

| 步骤 | 文件路径 | 格式 | 说明 |
|------|---------|------|------|
| 0 | `output/{sessionId}/{messageId}/step0_final_prompt.md` | MD | 附件处理后的完整 prompt |
| 1 | `output/{sessionId}/{messageId}/step1_requirement.md` | MD | 标准化需求文档 |
| 2 | `output/{sessionId}/{messageId}/step2_generation.json` | JSON | 代码生成结果（含 files 数组） |
| 2 | `output/{sessionId}/{messageId}/step2_generation_vue/` | Vue 文件目录 | 代码生成的 Vue 文件 |
| 3 | `output/{sessionId}/{messageId}/step3_optimization.json` | JSON | UX 优化结果（仅 CcUI） |
| 3 | `output/{sessionId}/{messageId}/step3_optimization_vue/` | Vue 文件目录 | 优化后的 Vue 文件 |

### 11.2 iterate / 重试

每次迭代或重试都会生成新的 messageId，产出文件结构同上：

| 步骤 | 文件路径 | 格式 | 说明 |
|------|---------|------|------|
| 迭代 | `output/{sessionId}/{messageId}/step0_iteration.json` | JSON | 迭代生成结果 |
| 迭代 | `output/{sessionId}/{messageId}/step0_iteration_vue/` | Vue 文件目录 | 迭代生成的 Vue 文件 |
| 重试步骤 M | `output/{sessionId}/{messageId}/step{M}_{name}.{ext}` | 同上 | 重试步骤的产出 |

### 11.3 前端访问方式

所有产出文件通过静态文件服务访问，`messageId` 直接从对应 Message 对象的 `id` 字段获取：

```
GET /output/{sessionId}/{messageId}/step1_requirement.md           → Markdown 文本
GET /output/{sessionId}/{messageId}/step2_generation.json          → JSON（含 files 数组）
GET /output/{sessionId}/{messageId}/step2_generation_vue/MainPage.vue → 单个 Vue 文件
```

---

## 12. 接口实现计划

### Phase 1：SSE 接口后端实现

1. 新增 SSE 工具函数 `sse_event()`
2. 挂载 `output` 目录为静态文件服务
3. 实现 messageId 目录隔离的文件命名逻辑
4. 实现 `POST /api/generate/initial/stream`（基于现有 `generate_initial` 逻辑改造）
5. 实现 `POST /api/generate/iterate/stream`（基于现有 `generate_iterate` 逻辑改造）
6. Session Message 写入逻辑扩展，新增 `stageOutputs` 字段（存路径，路径中含 messageId）

### Phase 2：Schema 扩展

1. `Message` schema 新增 `stageOutputs` 字段
2. `StageOutput` Pydantic Model 定义
3. SSE 事件数据结构的 Pydantic Model 定义

### Phase 3：测试与文档

1. SSE 接口的手动测试（curl / Postman）
2. 静态文件访问验证
3. 更新 API.md 文档

---

## 13. 向后兼容性

- 现有同步接口 `/api/generate/initial` 和 `/api/generate/iterate` **保持不变**
- Session Message 新增 `stageOutputs` 字段为可选，旧数据不受影响
- 前端可自行选择使用同步接口或 SSE 接口，逐步迁移
- 注意：SSE 接口的文件目录结构从扁平 `output/{sessionId}/step{N}_*` 变为嵌套 `output/{sessionId}/{messageId}/step{N}_*`，与同步接口的缓存文件结构不同，两者互不影响
