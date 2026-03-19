# `/api/generate/initial` 接口变更

## 一、请求参数变更

`GenerateInitialRequest` 新增字段：

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `fromStep` | `number \| null` | `null` | 从指定步骤开始重试，跳过之前已成功的步骤。可选值：`0`=附件处理, `1`=需求标准化, `2`=代码生成, `3`=UX优化 |

**约束：** 使用 `fromStep` 时必须同时传 `sessionId`，否则返回 400 错误。

请求示例（重试步骤2）：

```json
{
  "prompt": "原始需求",
  "sessionId": "xxx-xxx",
  "componentLib": "ElementUI",
  "fromStep": 2
}
```

## 二、`/api/generate/initial` 响应体变更

`GenerateInitialResponseData` 新增字段：

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `failedStep` | `number \| null` | `null` | 失败的步骤编号，**可直接作为 `fromStep` 传回重试**。`null` 表示全部成功 |

**注意：** `stages` 字段现在始终返回，不再受 `debug` 参数控制。

成功响应示例：

```json
{
  "code": 200,
  "data": {
    "files": "...",
    "message": "生成完成",
    "stages": {
      "attachment": { "status": "success", "duration": null, "output": null, "error": null },
      "requirement": { "status": "success", "duration": 12.5, "output": "...", "error": null },
      "generation": { "status": "success", "duration": 45.3, "output": "...", "error": null }
    },
    "failedStep": null
  }
}
```

步骤2失败响应示例：

```json
{
  "code": 200,
  "data": {
    "files": "...",
    "message": "生成失败: 连接超时...",
    "stages": {
      "attachment": { "status": "success", "...": "..." },
      "requirement": { "status": "success", "...": "..." },
      "generation": { "status": "failed", "duration": null, "output": null, "error": "连接超时..." }
    },
    "failedStep": 2
  }
}
```

## 三、Session 中 Message 对象变更

`generate/initial` 执行完成后，会自动往 session 的 `messages` 数组中 push 一条 `role: "assistant"` 的消息，**该消息携带失败信息**。

Message 对象新增字段：

| 字段 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `failedStep` | `number \| null` | `null` | 失败的步骤编号，`null` 表示成功 |
| `stages` | `object \| null` | `null` | 各步骤执行状态（同 generate 响应中的 stages） |

`GET /api/sessions/{sessionId}` 返回的 messages 示例：

```json
{
  "code": 200,
  "data": {
    "id": "1a43827c-...",
    "title": "我的项目",
    "componentLib": "ElementUI",
    "messages": [
      {
        "id": "aaa",
        "role": "user",
        "content": "帮我做一个后台管理系统",
        "timestamp": "2026-03-19T10:00:00"
      },
      {
        "id": "bbb",
        "role": "assistant",
        "content": "生成完成",
        "failedStep": 2,
        "stages": {
          "attachment": { "status": "success", "duration": null, "output": null, "error": null },
          "requirement": { "status": "success", "duration": 12.5, "output": "...", "error": null },
          "generation": { "status": "failed", "duration": null, "output": null, "error": "连接超时..." }
        },
        "timestamp": "2026-03-19T10:05:00"
      }
    ],
    "files": [...]
  }
}
```

**注意：** `Session` 对象本身不再有 `failedStep` 字段，失败信息统一在 assistant message 中。

## 四、前端对接建议

```js
// 1. 调用 generate/initial 后，直接判断响应
const res = await post('/api/generate/initial', {
  prompt, sessionId, componentLib, attachments
})

if (res.data.failedStep !== null) {
  // 展示重试按钮，用户点重试时：
  await post('/api/generate/initial', {
    prompt, sessionId, componentLib, fromStep: res.data.failedStep
  })
}

// 2. 页面刷新后，从 session 的 messages 中找到最后一条 assistant 消息
const session = await get(`/api/sessions/${sessionId}`)
const lastAiMsg = [...session.data.messages].reverse().find(m => m.role === "assistant")

if (lastAiMsg && lastAiMsg.failedStep !== null) {
  // 展示重试按钮，用户点重试时：
  await post('/api/generate/initial', {
    prompt: session.data.messages[0]?.content,  // 取第一条用户消息作为 prompt
    sessionId,
    componentLib: session.data.componentLib,
    fromStep: lastAiMsg.failedStep
  })
}
```

## 五、步骤与缓存文件对应关系（内部实现，前端无需关心）

| 步骤 | 缓存文件 | 说明 |
|---|---|---|
| 0 | `output/{sessionId}/step0_final_prompt.md` | 附件处理后的完整prompt |
| 1 | `output/{sessionId}/step1_requirement.md` | 标准化需求文档 |
| 2 | `output/{sessionId}/step2_generation.json` | 代码生成结果 |
| 3 | `output/{sessionId}/step3_optimization.json` | UX优化结果（仅CcUI） |
