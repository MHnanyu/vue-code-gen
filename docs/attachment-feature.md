# 附件上传功能 - 接口设计文档

## 概述

首页支持上传图片或 txt/md 文件作为生成页面的输入素材。

---

## 1. 新增文件上传接口

### POST `/api/upload`

**请求**

Content-Type: `multipart/form-data`

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| files | File[] | 是 | 支持多文件上传，最多5个 |

**响应**

```typescript
interface UploadResponse {
  files: Attachment[]
}

interface Attachment {
  id: string        // 文件唯一标识
  url: string       // 文件访问URL
  name: string      // 原始文件名
  type: 'image' | 'text' | 'markdown'
  size: number      // 文件大小（字节）
}
```

**示例**

```json
{
  "code": 0,
  "data": {
    "files": [
      {
        "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "url": "https://cdn.example.com/files/xxx.png",
        "name": "design.png",
        "type": "image",
        "size": 102400
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "url": "https://cdn.example.com/files/xxx.md",
        "name": "requirement.md",
        "type": "markdown",
        "size": 2048
      }
    ]
  }
}
```

---

## 2. 修改生成接口

### POST `/api/generate/initial`

**请求（新增 attachments 字段）**

```typescript
interface GenerateInitialRequest {
  prompt: string
  sessionId: string
  debug?: boolean
  componentLib?: ComponentLib
  attachments?: Attachment[]  // 新增
}

interface Attachment {
  id: string
  url: string
  name: string
  type: 'image' | 'text' | 'markdown'
}
```

**响应**（保持不变）

```typescript
interface GenerateInitialResponse {
  files: ApiFile[]
  message: string
  stages?: {
    requirement?: StageInfo
    generation?: StageInfo
    optimization?: StageInfo
  }
}
```

---

## 3. 前端代码修改

### 3.1 `src/api/index.ts` 新增上传方法

```typescript
export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  
  return request('/api/upload', {
    method: 'POST',
    headers: {},  // 不设置 Content-Type，让浏览器自动设置
    body: formData,
  })
}

interface UploadResponse {
  files: Attachment[]
}

interface Attachment {
  id: string
  url: string
  name: string
  type: 'image' | 'text' | 'markdown'
}
```

### 3.2 `src/api/index.ts` 修改 GenerateInitialRequest

```typescript
interface GenerateInitialRequest {
  prompt: string
  sessionId: string
  debug?: boolean
  componentLib?: ComponentLib
  attachments?: Attachment[]  // 新增
}
```

### 3.3 `src/views/HomeView.vue` 修改 handleGenerate

```typescript
async function handleGenerate() {
  if (!canGenerate.value || loading.value) return

  loading.value = true
  try {
    let attachments: Attachment[] = []
    
    // 上传文件
    if (fileList.value.length > 0) {
      const files = fileList.value
        .filter(f => f.raw)
        .map(f => f.raw!)
      const result = await uploadFiles(files)
      attachments = result.files
    }
    
    store.setPrompt(prompt.value)
    store.clearFiles()
    chatStore.setPendingPrompt(prompt.value)
    chatStore.setPendingAttachments(attachments)  // 新增

    const sessionId = await chatStore.createSessionRemote(
      prompt.value.slice(0, 30) || `基于${attachments.length}个文件生成`,
      selectedLib.value as ComponentLib
    )
    if (sessionId) {
      router.push({ path: '/workspace', query: { session_id: sessionId } })
    }
  } finally {
    loading.value = false
  }
}
```

### 3.4 `src/stores/chat.ts` 新增 pendingAttachments

```typescript
const pendingAttachments = ref<Attachment[]>([])

function setPendingAttachments(attachments: Attachment[]) {
  pendingAttachments.value = attachments
}

function clearPendingAttachments() {
  pendingAttachments.value = []
}

return {
  // ...existing
  pendingAttachments,
  setPendingAttachments,
  clearPendingAttachments,
}
```

---

## 4. 调用流程

```
用户选择文件 → 点击生成 → 
  调用 /api/upload 上传文件 → 
  获取 attachments → 
  创建 session → 
  跳转 workspace → 
  调用 /api/generate/initial（携带 prompt + attachments）→
  返回生成的文件
```

---

## 5. 文件类型判断规则（后端参考）

| 扩展名 | type |
|--------|------|
| .png, .jpg, .jpeg, .gif, .webp, .svg | image |
| .md, .markdown | markdown |
| .txt | text |
