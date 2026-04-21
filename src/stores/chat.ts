import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatMessage, ChatSession, ComponentLib, SessionMode } from '@/types'
import type { Attachment } from '@/api'
import {
  getSessions as apiGetSessions,
  getSession as apiGetSession,
  deleteSession as apiDeleteSession,
  updateSessionTitle as apiUpdateSessionTitle,
  addMessage as apiAddMessage,
  createSession as apiCreateSession,
  transformApiSession,
} from '@/api'
import { useChatStageState } from '@/composables/useChatStageState'

export const useChatStore = defineStore('chat', () => {
  const {
    isStreaming,
    isRetrying,
    retrySessionLoaded,
    currentTaskId,
    stageProgresses,
    stagePreviewMap,
    activeStageTab,
    retryInvalidatedStageNames,
    currentStreamingStage,
    resetStageProgresses,
    setStageProgresses,
    updateStageStatus,
    setStagePreview,
    cancelStreaming,
    setActiveStageTab,
    invalidateStageCache,
    clearRetryInvalidatedStageNames,
  } = useChatStageState()

  const sessions = ref<ChatSession[]>([])
  const currentSessionId = ref<string | null>(null)
  const isLoading = ref(false)
  const pendingPrompt = ref<string | null>(null)
  const pendingAttachments = ref<Attachment[]>([])

  const currentSession = computed(() =>
    sessions.value.find(s => s.id === currentSessionId.value) || null
  )

  const sortedSessions = computed(() =>
    [...sessions.value].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  )

  const hasStepMessages = computed(() => {
    const session = currentSession.value
    if (!session) return false
    return session.messages.some(
      m => m.role === 'assistant' && m.stepMessages && m.stepMessages.length > 0,
    )
  })

  async function createSessionRemote(title: string, componentLib?: ComponentLib, mode?: SessionMode): Promise<string | null> {
    try {
      const apiSession = await apiCreateSession(title, componentLib, mode)
      const session = transformApiSession(apiSession)
      sessions.value.unshift(session)
      currentSessionId.value = session.id
      return session.id
    } catch (error) {
      console.error('Failed to create session:', error)
      return null
    }
  }

  async function loadSessions(): Promise<void> {
    try {
      const result = await apiGetSessions()
      sessions.value = result.list.map(transformApiSession)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  async function loadSession(sessionId: string): Promise<void> {
    try {
      const apiSession = await apiGetSession(sessionId)
      const session = transformApiSession(apiSession)
      const index = sessions.value.findIndex(s => s.id === sessionId)
      if (index > -1) {
        sessions.value[index] = session
      } else {
        sessions.value.push(session)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  async function deleteSessionRemote(id: string): Promise<void> {
    try {
      await apiDeleteSession(id)
      const index = sessions.value.findIndex(s => s.id === id)
      if (index > -1) {
        sessions.value.splice(index, 1)
        if (currentSessionId.value === id) {
          currentSessionId.value = sessions.value[0]?.id || null
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  async function updateSessionTitleRemote(id: string, title: string): Promise<void> {
    try {
      await apiUpdateSessionTitle(id, title)
      const session = sessions.value.find(s => s.id === id)
      if (session) {
        session.title = title.slice(0, 30) + (title.length > 30 ? '...' : '')
      }
    } catch (error) {
      console.error('Failed to update session title:', error)
    }
  }

  function selectSession(id: string): void {
    currentSessionId.value = id
  }

  function addMessageLocal(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage | undefined {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return undefined

    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    }
    session.messages.push(newMessage)
    session.updatedAt = new Date()
    return newMessage
  }

  async function addMessageRemote(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage | undefined> {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return undefined

    try {
      const apiMessage = await apiAddMessage(sessionId, {
        role: message.role,
        content: message.content,
        attachments: message.attachments,
      })

      const newMessage: ChatMessage = {
        id: apiMessage.id,
        role: apiMessage.role,
        content: apiMessage.content,
        timestamp: new Date(apiMessage.timestamp),
        attachments: apiMessage.attachments,
      }
      session.messages.push(newMessage)
      session.updatedAt = new Date()
      return newMessage
    } catch (error) {
      console.error('Failed to add message:', error)
      return undefined
    }
  }

  function setLoading(value: boolean): void {
    isLoading.value = value
  }

  function setPendingPrompt(prompt: string | null): void {
    pendingPrompt.value = prompt
  }

  function setPendingAttachments(attachments: Attachment[]): void {
    pendingAttachments.value = attachments
  }

  function clearPendingAttachments(): void {
    pendingAttachments.value = []
  }

  function removeLastAssistantMessage(sessionId: string, onlyIfFailed = false): void {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return
    const msgs = session.messages
    const lastIdx = msgs.length - 1
    if (lastIdx < 0 || msgs[lastIdx].role !== 'assistant') return
    if (onlyIfFailed && msgs[lastIdx].failedStep == null) return
    msgs.splice(lastIdx, 1)
  }

  function updateSessionFiles(sessionId: string, files: ChatSession['files']): void {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.files = files
      session.updatedAt = new Date()
    }
  }

  return {
    sessions,
    currentSessionId,
    isLoading,
    pendingPrompt,
    pendingAttachments,
    currentSession,
    sortedSessions,
    hasStepMessages,
    createSessionRemote,
    selectSession,
    addMessageLocal,
    addMessageRemote,
    deleteSessionRemote,
    updateSessionTitleRemote,
    loadSessions,
    loadSession,
    setLoading,
    setPendingPrompt,
    setPendingAttachments,
    clearPendingAttachments,
    removeLastAssistantMessage,
    updateSessionFiles,
    isStreaming,
    isRetrying,
    retrySessionLoaded,
    currentTaskId,
    stageProgresses,
    stagePreviewMap,
    activeStageTab,
    currentStreamingStage,
    retryInvalidatedStageNames,
    resetStageProgresses,
    setStageProgresses,
    updateStageStatus,
    setStagePreview,
    cancelStreaming,
    setActiveStageTab,
    invalidateStageCache,
    clearRetryInvalidatedStageNames,
  }
})
