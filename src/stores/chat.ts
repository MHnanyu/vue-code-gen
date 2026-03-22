import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatMessage, ChatSession, ComponentLib, StageProgressState } from '@/types'
import type { Attachment, ApiFile } from '@/api'
import {
  createSession as apiCreateSession,
  getSessions as apiGetSessions,
  getSession as apiGetSession,
  deleteSession as apiDeleteSession,
  updateSessionTitle as apiUpdateSessionTitle,
  addMessage as apiAddMessage,
  cancelGeneration as apiCancelGeneration,
  transformApiSession,
} from '@/api'

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>([])
  const currentSessionId = ref<string | null>(null)
  const isLoading = ref(false)
  const pendingPrompt = ref<string | null>(null)
  const pendingAttachments = ref<Attachment[]>([])

  const isStreaming = ref(false)
  const currentTaskId = ref<string | null>(null)
  const stageProgresses = ref<StageProgressState[]>([])
  const stagePreviewMap = ref<Map<string, { type: 'markdown' | 'vue' | null; content: string | null; files: ApiFile[] | null; filePath: string | null }>>(new Map())
  const activeStageTab = ref<string | null>(null)

  const currentSession = computed(() =>
    sessions.value.find(s => s.id === currentSessionId.value) || null
  )

  const sortedSessions = computed(() =>
    [...sessions.value].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  )

  const currentStreamingStage = computed(() => {
    return stageProgresses.value.find(s => s.status === 'running') ?? null
  })

  const hasStepMessages = computed(() => {
    const session = currentSession.value
    if (!session) return false
    return session.messages.some(
      m => m.role === 'assistant' && m.stepMessages && m.stepMessages.length > 0,
    )
  })

  function resetStageProgresses(stageNames: string[]): void {
    stageProgresses.value = stageNames.map((name, index) => ({
      stage: index,
      stageName: name,
      status: 'pending' as const,
      duration: null,
    }))
  }

  function setStageProgresses(progresses: StageProgressState[]): void {
    stageProgresses.value = progresses
  }

  function updateStageStatus(
    stage: number,
    status: StageProgressState['status'],
    extra?: Partial<StageProgressState>,
  ): void {
    const item = stageProgresses.value.find(s => s.stage === stage)
    if (item) {
      item.status = status
      if (extra) {
        Object.assign(item, extra)
      }
    }
  }

  function setStagePreview(
    stageName: string,
    type: 'markdown' | 'vue' | null,
    content: string | null,
    files: ApiFile[] | null,
    filePath: string | null = null,
  ): void {
    stagePreviewMap.value.set(stageName, { type, content, files, filePath })
  }

  function cancelStreaming(): void {
    if (!currentTaskId.value || !isStreaming.value) return
    apiCancelGeneration(currentTaskId.value).catch((e) => {
      console.error('Cancel generation failed:', e)
    })
  }

  function setActiveStageTab(stageName: string | null): void {
    if (activeStageTab.value === stageName && stageName !== null) {
      activeStageTab.value = null
      return
    }
    activeStageTab.value = stageName
  }

  async function createSessionRemote(title: string, componentLib?: ComponentLib): Promise<string | null> {
    try {
      const apiSession = await apiCreateSession(title, componentLib)
      const session = transformApiSession(apiSession)
      sessions.value.unshift(session)
      currentSessionId.value = session.id
      return session.id
    } catch (error) {
      console.error('Failed to create session:', error)
      return null
    }
  }

  async function loadSessions() {
    try {
      const result = await apiGetSessions()
      sessions.value = result.list.map(transformApiSession)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  async function loadSession(sessionId: string) {
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

  function removeSessionLocally(id: string) {
    const index = sessions.value.findIndex(s => s.id === id)
    if (index > -1) {
      sessions.value.splice(index, 1)
      if (currentSessionId.value === id) {
        currentSessionId.value = sessions.value[0]?.id || null
      }
    }
  }

  async function deleteSessionRemote(id: string) {
    try {
      await apiDeleteSession(id)
      removeSessionLocally(id)
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  async function updateSessionTitleRemote(id: string, title: string) {
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

  function createSession(title: string): ChatSession {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      title: title.slice(0, 30) + (title.length > 30 ? '...' : ''),
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    sessions.value.unshift(session)
    currentSessionId.value = session.id
    return session
  }

  function selectSession(id: string) {
    currentSessionId.value = id
  }

  function addMessageLocal(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return

    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    }
    session.messages.push(newMessage)
    session.updatedAt = new Date()
    return newMessage
  }

  async function addMessageRemote(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return

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
    }
  }

  function setLoading(value: boolean) {
    isLoading.value = value
  }

  function setPendingPrompt(prompt: string | null) {
    pendingPrompt.value = prompt
  }

  function setPendingAttachments(attachments: Attachment[]) {
    pendingAttachments.value = attachments
  }

  function clearPendingAttachments() {
    pendingAttachments.value = []
  }

  function updateSessionFiles(sessionId: string, files: ChatSession['files']) {
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
    isStreaming,
    currentTaskId,
    stageProgresses,
    stagePreviewMap,
    activeStageTab,
    currentStreamingStage,
    hasStepMessages,
    createSession,
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
    updateSessionFiles,
    resetStageProgresses,
    setStageProgresses,
    updateStageStatus,
    setStagePreview,
    cancelStreaming,
    setActiveStageTab,
  }
})
