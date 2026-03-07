import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatMessage, ChatSession } from '@/types'

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

  function addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) {
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
    selectSession,
    addMessage,
    deleteSession,
    setLoading,
    setPendingPrompt
  }
})
