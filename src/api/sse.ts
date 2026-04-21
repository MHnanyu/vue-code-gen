import type {
  StageStartEvent,
  StageProgressEvent,
  StageCompleteEvent,
  DoneEvent,
  ErrorEvent,
  CancelledEvent,
} from '@/types'
import { API_BASE } from '@/api'

export interface SSECallbacks {
  onStageStart?: (event: StageStartEvent) => void
  onStageProgress?: (event: StageProgressEvent) => void
  onStageComplete?: (event: StageCompleteEvent) => void
  onDone?: (event: DoneEvent) => void
  onError?: (event: ErrorEvent) => void
  onCancelled?: (event: CancelledEvent) => void
}

export async function fetchSSEStream(
  endpoint: string,
  body: Record<string, unknown>,
  callbacks: SSECallbacks,
): Promise<void> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
    case 'cancelled':
      callbacks.onCancelled?.(data as CancelledEvent)
      break
  }
}
