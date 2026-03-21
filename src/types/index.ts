import type { ApiFile, Attachment } from '@/api'

export interface StageInfo {
  status: 'success' | 'skipped' | 'error' | 'failed'
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

export interface StepMessage {
  stage: number
  stageName: string
  message: string
  status: 'success' | 'skipped' | 'failed' | 'cached'
  duration: number | null
  outputPreview?: string | null
  outputType?: 'markdown' | 'json' | 'vue' | null
  filePath?: string | null
  vueDirPath?: string | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: Attachment[]
  failedStep?: number | null
  stages?: Stages | null
  stepMessages?: StepMessage[] | null
}

export interface StageStartEvent {
  stage: number
  stageName: string
  taskId: string
  isRetry?: boolean
  timestamp: string
}

export interface StageProgressEvent {
  stage: number
  stageName: string
  message: string
  progress?: number
  timestamp: string
}

export interface StageCompleteEvent {
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
  message?: string
  timestamp: string
}

export interface DoneEvent {
  files: ApiFile[]
  message: string
  stages: Record<string, StageInfo>
  failedStep: number | null
  stepMessages?: StepMessage[] | null
  timestamp: string
}

export interface ErrorEvent {
  code: number
  message: string
  failedStep: number | null
  stages: Record<string, StageInfo>
  timestamp: string
}

export interface CancelledEvent {
  cancelledAtStep: number
  stages: Record<string, StageInfo>
  timestamp: string
}

export interface StageProgressState {
  stage: number
  stageName: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cached'
  duration: number | null
  progressMessage?: string
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
