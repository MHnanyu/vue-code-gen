import { computed } from 'vue'
import { INITIAL_STAGE_KEYS } from '@/constants/stages'
import type { ChatMessage, StageProgressState, StepMessage } from '@/types'
import { useChatStore } from '@/stores/chat'

const STATUS_MAP: Record<string, StageProgressState['status']> = {
  success: 'success',
  cached: 'cached',
  skipped: 'skipped',
  error: 'failed',
  failed: 'failed',
  cancelled: 'cancelled',
}

function buildProgressState(
  stageName: string,
  stageIndex: number,
  stageInfo: any,
  progressMessage?: string,
): StageProgressState {
  if (!stageInfo) {
    return { stage: stageIndex, stageName, status: 'pending', duration: null }
  }
  const status: StageProgressState['status'] = STATUS_MAP[stageInfo.status] || 'pending'
  return {
    stage: stageIndex,
    stageName,
    status,
    duration: stageInfo.duration ?? null,
    progressMessage: stageInfo.error || progressMessage || undefined,
  }
}

export function stagesToProgressStates(
  stages: any,
  stepMessages?: any[] | null,
  failedStep?: number | null,
): StageProgressState[] {
  const hasInitial = INITIAL_STAGE_KEYS.some(k => stages?.[k])

  if (!hasInitial && stepMessages && stepMessages.length > 0) {
    const stepMsgMap = new Map<string, string>()
    for (const sm of stepMessages) {
      if (sm.stageName && sm.message) {
        stepMsgMap.set(sm.stageName, sm.message)
      }
    }

    return stepMessages.map((sm, index) =>
      buildProgressState(
        sm.stageName,
        sm.stage ?? index,
        stages?.[sm.stageName],
        stepMsgMap.get(sm.stageName),
      ),
    )
  }

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
        return { stage: index, stageName: name, status: 'cancelled' as const, duration: null }
      }
      return { stage: index, stageName: name, status: 'pending' as const, duration: null }
    }
    return buildProgressState(name, index, s, stepMsgMap.get(name))
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
    .map(s => {
      const previewPath = previewMap.get(s.stageName)
      const filePaths = previewPath ? [previewPath] : null
      let fileCategory: 'file' | 'files' | null = null
      if (s.stageName === 'attachment' || s.stageName === 'requirement' || s.stageName === 'normalize_requirement') {
        fileCategory = 'file'
      } else if (s.stageName === 'generation' || s.stageName === 'optimization' || s.stageName === 'iteration'
        || s.stageName === 'generate_vue_code' || s.stageName === 'optimize_ux') {
        fileCategory = 'files'
      }
      return {
        stage: s.stage,
        stageName: s.stageName,
        message: s.progressMessage || '',
        status: s.status as StepMessage['status'],
        duration: s.duration,
        filePath: filePaths,
        fileCategory,
      }
    })
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
