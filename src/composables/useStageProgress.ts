import { computed } from 'vue'
import { INITIAL_STAGE_KEYS } from '@/constants/stages'
import type { ChatMessage, StageProgressState, StepMessage } from '@/types'
import { useChatStore } from '@/stores/chat'

export function stagesToProgressStates(
  stages: any,
  stepMessages?: any[] | null,
  failedStep?: number | null,
): StageProgressState[] {
  const hasInitial = INITIAL_STAGE_KEYS.some(k => stages?.[k])
  const keys = hasInitial ? INITIAL_STAGE_KEYS : ['iteration']
  const stepMsgMap = new Map<string, string>()
  if (stepMessages) {
    for (const sm of stepMessages) {
      if (sm.stageName && sm.message) {
        stepMsgMap.set(sm.stageName, sm.message)
      }
    }
  }
  return keys.map((name, index) => {
    const s = stages?.[name]
    if (!s) {
      if (failedStep != null && index >= failedStep) {
        return { stage: index, stageName: name, status: 'cancelled', duration: null }
      }
      return { stage: index, stageName: name, status: 'pending', duration: null }
    }
    const status: StageProgressState['status'] =
      s.status === 'success' ? 'success' :
      s.status === 'cached' ? 'cached' :
      s.status === 'skipped' ? 'skipped' :
      s.status === 'error' || s.status === 'failed' ? 'failed' :
      s.status === 'cancelled' ? 'cancelled' : 'pending'
    return {
      stage: index,
      stageName: name,
      status,
      duration: s.duration ?? null,
      progressMessage: s.error || stepMsgMap.get(name) || undefined,
    }
  })
}

export function messageProgresses(message: { stages?: any; stepMessages?: any[] | null; failedStep?: number | null }): StageProgressState[] {
  if (!message.stages) return []
  return stagesToProgressStates(message.stages, message.stepMessages, message.failedStep)
}

export function buildFallbackStepMessages(
  progresses: StageProgressState[],
  previewMap: Map<string, string | null>,
): StepMessage[] {
  return progresses
    .filter(s => s.status !== 'pending')
    .map(s => ({
      stage: s.stage,
      stageName: s.stageName,
      message: s.progressMessage || '',
      status: s.status as StepMessage['status'],
      duration: s.duration,
      filePath: previewMap.get(s.stageName) || null,
    }))
}

export function useStageProgress() {
  const chatStore = useChatStore()

  const lastAssistantMessage = computed(() => {
    const msgs = chatStore.currentSession?.messages || []
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') return msgs[i]
    }
    return null
  })

  const lastAssistantIndex = computed(() => {
    if (!lastAssistantMessage.value) return -1
    return chatStore.currentSession!.messages.indexOf(lastAssistantMessage.value)
  })

  function isLastAssistantMessage(index: number): boolean {
    return lastAssistantIndex.value === index
  }

  const persistedStageProgresses = computed(() => {
    if (!lastAssistantMessage.value?.stages) return []
    return stagesToProgressStates(lastAssistantMessage.value.stages, lastAssistantMessage.value.stepMessages, lastAssistantMessage.value.failedStep)
  })

  function shouldShowMessageProgress(message: ChatMessage, idx: number): boolean {
    if (!isLastAssistantMessage(idx)) {
      return messageProgresses(message).length > 0
    }
    if (chatStore.isRetrying && chatStore.isStreaming) {
      return chatStore.stageProgresses.length > 0
    }
    if (chatStore.isRetrying) {
      return persistedStageProgresses.value.length > 0
    }
    return !!message.stages
  }

  function getMessageProgress(message: ChatMessage, idx: number): StageProgressState[] {
    if (isLastAssistantMessage(idx)) {
      if (chatStore.isRetrying && chatStore.isStreaming) {
        return chatStore.stageProgresses
      }
      if (chatStore.isRetrying) {
        return persistedStageProgresses.value
      }
    }
    return messageProgresses(message)
  }

  function showErrorMessage(message: ChatMessage, idx: number): boolean {
    return isLastAssistantMessage(idx)
      && !chatStore.isStreaming
      && chatStore.stageProgresses.length === 0
      && message.failedStep != null
  }

  const showStreamingBubble = computed(() => {
    if (!chatStore.isStreaming) return false
    if (!chatStore.isRetrying) return true
    return lastAssistantIndex.value === -1
  })

  const streamingBubbleLabel = computed(() =>
    chatStore.isRetrying ? '正在重试...' : '正在生成...'
  )

  return {
    lastAssistantMessage,
    lastAssistantIndex,
    isLastAssistantMessage,
    persistedStageProgresses,
    shouldShowMessageProgress,
    getMessageProgress,
    showErrorMessage,
    showStreamingBubble,
    streamingBubbleLabel,
  }
}
