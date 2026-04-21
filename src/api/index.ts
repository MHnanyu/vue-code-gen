import type { ProjectFile, ComponentLib, Stages, StepMessage } from '@/types'

export const API_BASE = 'http://localhost:8000'

interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

interface ApiFile {
  id: string
  name: string
  path: string
  type: 'file' | 'folder'
  language?: string
  content?: string
  children?: ApiFile[]
}

export type { ApiFile }

export interface Attachment {
  id: string
  url: string
  name: string
  type: 'image' | 'text' | 'markdown'
}

interface ApiSession {
  id: string
  userId?: string | null
  title: string
  messages?: ApiMessage[]
  files?: ApiFile[]
  componentLib?: ComponentLib
  createdAt: string
  updatedAt: string
}

interface ApiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  attachments?: Attachment[]
  files?: ApiFile[]
  failedStep?: number | null
  stages?: Stages | null
  stepMessages?: StepMessage[] | null
}

interface CreateSessionRequest {
  title?: string
  componentLib?: ComponentLib
}

interface AddMessageRequest {
  role: 'user' | 'assistant'
  content: string
  attachments?: Attachment[]
}

interface SessionListResponse {
  total: number
  list: ApiSession[]
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result: ApiResponse<T> = await response.json()

  if (result.code !== 0) {
    throw new Error(result.message || 'API error')
  }

  return result.data
}

export async function createSession(title?: string, componentLib?: ComponentLib): Promise<ApiSession> {
  return request<ApiSession>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ title, componentLib } as CreateSessionRequest),
  })
}

interface GenerateInitialRequest {
  prompt: string
  sessionId: string
  debug?: boolean
  componentLib?: ComponentLib
  attachments?: Attachment[]
  fromStep?: number | null
}

interface GenerateIterateRequest {
  prompt: string
  sessionId: string
  files: ApiFile[]
  fromStep?: number | null
}

export async function getSessions(page = 1, pageSize = 20): Promise<SessionListResponse> {
  return request<SessionListResponse>(`/api/sessions?page=${page}&pageSize=${pageSize}`)
}

export async function getSession(sessionId: string): Promise<ApiSession> {
  return request<ApiSession>(`/api/sessions/${sessionId}`)
}

export async function deleteSession(sessionId: string): Promise<void> {
  return request(`/api/sessions/${sessionId}`, {
    method: 'DELETE',
  })
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  return request(`/api/sessions/${sessionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

export async function addMessage(sessionId: string, req: AddMessageRequest): Promise<ApiMessage> {
  return request<ApiMessage>(`/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export function transformApiFiles(files: ApiFile[]): ProjectFile[] {
  return files.map((file) => ({
    id: file.id,
    name: file.name,
    path: file.path,
    type: file.type,
    language: file.language as ProjectFile['language'],
    content: file.content,
    children: file.children ? transformApiFiles(file.children) : undefined,
  }))
}

function parseDate(dateStr: string): Date {
  if (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr)
  }
  return new Date(dateStr + 'Z')
}

export function transformApiSession(session: ApiSession) {
  return {
    id: session.id,
    title: session.title,
    messages: (session.messages || []).map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      timestamp: parseDate(msg.timestamp),
      attachments: msg.attachments,
      files: msg.files,
      failedStep: msg.failedStep,
      stages: msg.stages,
      stepMessages: msg.stepMessages,
    })),
    files: session.files,
    componentLib: session.componentLib,
    createdAt: parseDate(session.createdAt),
    updatedAt: parseDate(session.updatedAt),
  }
}

interface UpdateFilesRequest {
  files: ApiFile[]
}

export async function updateSessionFiles(sessionId: string, files: ApiFile[]): Promise<void> {
  return request(`/api/sessions/${sessionId}/files`, {
    method: 'PATCH',
    body: JSON.stringify({ files } as UpdateFilesRequest),
  })
}

interface UploadResponse {
  files: Attachment[]
}

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const result: ApiResponse<UploadResponse> = await response.json()

  if (result.code !== 0) {
    throw new Error(result.message || 'API error')
  }

  return result.data
}

import { fetchSSEStream, type SSECallbacks } from './sse'

export type { SSECallbacks }

export function generateInitialStream(
  params: GenerateInitialRequest,
  callbacks: SSECallbacks,
): Promise<void> {
  return fetchSSEStream(
    '/api/generate/initial/stream',
    params as unknown as Record<string, unknown>,
    callbacks,
  )
}

export function generateIterateStream(
  params: GenerateIterateRequest,
  callbacks: SSECallbacks,
): Promise<void> {
  return fetchSSEStream(
    '/api/generate/iterate/stream',
    params as unknown as Record<string, unknown>,
    callbacks,
  )
}

export async function cancelGeneration(taskId: string): Promise<void> {
  await fetch(`${API_BASE}/api/generate/cancel?taskId=${taskId}`, { method: 'POST' })
}

export async function fetchStageFile(filePath: string): Promise<string> {
  const response = await fetch(`${API_BASE}/${filePath}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch stage file: ${response.status}`)
  }
  return response.text()
}

export async function fetchStageJson<T = unknown>(filePath: string): Promise<T> {
  const response = await fetch(`${API_BASE}/${filePath}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch stage JSON: ${response.status}`)
  }
  return response.json()
}
