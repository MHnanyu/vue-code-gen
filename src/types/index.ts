import type { ApiFile } from '@/api'

// 对话消息类型
export interface Attachment {
  id: string
  url: string
  name: string
  type: 'image' | 'text' | 'markdown'
}

export interface StageInfo {
  status: 'success' | 'skipped' | 'error'
  duration: number | null
  output: string | null
  error: string | null
}

export interface Stages {
  attachment?: StageInfo
  requirement?: StageInfo
  generation?: StageInfo
  optimization?: StageInfo
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: Attachment[]
  failedStep?: number | null
  stages?: Stages | null
}

export type ComponentLib = 'ElementUI' | 'aui' | 'ccui'

// 对话会话类型
export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  files?: ApiFile[]
  componentLib?: ComponentLib
  createdAt: Date
  updatedAt: Date
}

// 项目文件类型
export interface ProjectFile {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  content?: string
  language?: 'vue' | 'typescript' | 'javascript' | 'css' | 'html' | 'json'
  children?: ProjectFile[]
  readonly?: boolean
}
