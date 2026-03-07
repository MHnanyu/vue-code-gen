import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatMessage, ChatSession } from '@/types'
import {
  createSession as apiCreateSession,
  getSessions as apiGetSessions,
  getSession as apiGetSession,
  deleteSession as apiDeleteSession,
  transformApiSession,
} from '@/api'

export const useChatStore = defineStore('chat', () => {
  const sessions = ref<ChatSession[]>([])
  const currentSessionId = ref<string | null>(null)
  const isLoading = ref(false)
  const pendingPrompt = ref<string | null>(null)

  const currentSession = computed(() =>
    sessions.value.find(s => s.id === currentSessionId.value) || null
  )

  const sortedSessions = computed(() =>
    [...sessions.value].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  )

  async function createSessionRemote(title: string): Promise<string | null> {
    try {
      const apiSession = await apiCreateSession(title)
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

  async function deleteSessionRemote(id: string) {
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

  function deleteSession(id: string) {
    const index = sessions.value.findIndex(s => s.id === id)
    if (index > -1) {
      sessions.value.splice(index, 1)
      if (currentSessionId.value === id) {
        currentSessionId.value = sessions.value[0]?.id || null
      }
    }
  }

  function setLoading(value: boolean) {
    isLoading.value = value
  }

  function setPendingPrompt(prompt: string | null) {
    pendingPrompt.value = prompt
  }

  return {
    sessions,
    currentSessionId,
    isLoading,
    pendingPrompt,
    currentSession,
    sortedSessions,
    createSession,
    createSessionRemote,
    selectSession,
    addMessageLocal,
    deleteSession,
    deleteSessionRemote,
    loadSessions,
    loadSession,
    setLoading,
    setPendingPrompt
  }
})
