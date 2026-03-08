import type { ProjectFile } from '@/types'

const API_BASE = 'http://localhost:8000'

interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

interface GenerateRequest {
  prompt: string
  componentLib?: string
  sessionId?: string
  files?: ApiFile[]
}

interface GenerateResponse {
  files: ApiFile[]
  message: string
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

interface ApiSession {
  id: string
  userId?: string | null
  title: string
  messages?: ApiMessage[]
  files?: ApiFile[]
  createdAt: string
  updatedAt: string
}

interface ApiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface CreateSessionRequest {
  title?: string
}

interface AddMessageRequest {
  role: 'user' | 'assistant'
  content: string
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

export async function checkHealth(): Promise<{ status: string; mongodb: string }> {
  return request('/health')
}

export async function generateCode(req: GenerateRequest): Promise<GenerateResponse> {
  return request('/api/generate', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}

export async function createSession(title?: string): Promise<ApiSession> {
  return request<ApiSession>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({ title } as CreateSessionRequest),
  })
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
    })),
    files: session.files,
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
