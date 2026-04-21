import type { Attachment } from '@/api'
import type { ApiFile } from '@/api'

export interface StageInfo {
  status: 'success' | 'skipped' | 'error' | 'failed' | 'cancelled'
  duration: number | null
  output: string | null
  error: string | null
}

export interface Stages {
  attachment?: StageInfo
  requirement?: StageInfo
  generation?: StageInfo
  optimization?: StageInfo
  [key: string]: StageInfo | undefined
}

export interface StepMessage {
  stage: number
  stageName: string
  message?: string
  status: 'success' | 'skipped' | 'failed' | 'cached'
  duration: number | null
  outputType?: 'markdown' | 'json' | 'vue' | null
  filePath?: string[] | null
  fileCategory?: 'file' | 'files' | null
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: Attachment[]
  files?: ApiFile[]
  failedStep?: number | null
  stages?: Stages | null
  stepMessages?: StepMessage[] | null
  agentMetadata?: AgentMessageMetadata
  toolCalls?: AgentToolCallRecord[]
}

export interface AgentToolCallRecord {
  toolName: string
  arguments: string
  status: 'success' | 'failed'
  result: Record<string, any>
  duration: number
  timestamp: string
}

export interface AgentMessageMetadata {
  thinkingContent: string
  toolCalls: {
    toolName: string
    label: string
    status: 'calling' | 'completed' | 'failed'
    step: number
    outputUrls: string[]
    outputType: 'file' | 'files' | null
    arguments?: string
    result?: Record<string, any>
  }[]
  files?: {
    name: string
    path: string
    lines: number
    sizeBytes: number
  }[]
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
  filePath: string | null
  error: string | null
  message?: string
  timestamp: string
}

export interface DoneEvent {
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
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'cached' | 'cancelled'
  duration: number | null
  progressMessage?: string
}

export interface AgentThinkingEvent {
  content: string
  step: number
  taskId: string
  timestamp: string
}

export interface AgentToolCallStartEvent {
  toolName: string
  arguments: string
  step: number
  timestamp: string
}

export interface AgentToolCallResultEvent {
  toolName: string
  result: Record<string, any>
  step: number
  outputUrls: string[]
  outputType: 'file' | 'files'
  timestamp: string
}

export interface AgentDoneEvent {
  files: AgentFileSummary[] | null
  timestamp: string
}

export interface AgentFileSummary {
  name: string
  path: string
  lines: number
  size_bytes: number
}

export interface AgentFilesEvent {
  files: AgentFileItem[]
  timestamp: string
}

export interface AgentFileItem {
  name: string
  path: string
  downloadUrl: string
  lines: number
  sizeBytes: number
}

export interface AgentCancelledEvent {
  cancelledAtStep: number
  timestamp: string
}

export interface AgentErrorEvent {
  code: number
  message: string
  failedStep: number | null
  stages: Record<string, any>
  timestamp: string
}

export interface AgentToolCallState {
  toolName: string
  status: 'calling' | 'completed' | 'failed'
  step: number
  label: string
  outputUrls: string[]
  outputType: 'file' | 'files' | null
  arguments?: string
  result?: Record<string, any>
  duration?: number
}

export type ComponentLib = 'ElementUI' | 'aui' | 'ccui'

export type SessionMode = 'pipeline' | 'agent'

// 对话会话类型
export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  files?: ApiFile[]
  componentLib?: ComponentLib
  mode?: SessionMode
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
