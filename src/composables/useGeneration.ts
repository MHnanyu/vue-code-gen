import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chat'
import { useProjectStore } from '@/stores/project'
import { generateInitialStream, generateIterateStream, type SSECallbacks, type Attachment } from '@/api'
import { apiFilesToProjectFiles } from '@/utils/files'
import { INITIAL_STAGE_KEYS } from '@/constants/stages'
import type { ChatMessage, StageProgressState, StepMessage } from '@/types'
import { stagesToProgressStates, buildFallbackStepMessages } from '@/composables/useStageProgress'

function processFilesToProject(files: any[], componentLib?: string): void {
  const projectFiles = apiFilesToProjectFiles(files, componentLib as any)
  const projectStore = useProjectStore()
  projectStore.setFiles(projectFiles)
}

export function useGeneration(scrollToBottom: () => void) {
  const chatStore = useChatStore()

  const inputMessage = ref('')
  const pendingUserMessage = ref('')
  const currentAttachments = ref<Attachment[]>([])
  const postStreamReloadNeeded = ref(false)
  const messagesContainer = ref<HTMLElement | null>(null)

  const isLoading = computed(() => chatStore.isLoading)

  function buildCallbacks(sessionId: string): SSECallbacks {
    return {
      onStageStart(event) {
        if (!chatStore.currentTaskId) {
          chatStore.currentTaskId = event.taskId
        }
        if (chatStore.isRetrying && chatStore.currentSessionId && !chatStore.retrySessionLoaded) {
          chatStore.retrySessionLoaded = true
          chatStore.loadSession(chatStore.currentSessionId).then(() => {
            chatStore.isRetrying = true
            const session = chatStore.currentSession
            if (session?.files && session.files.length > 0) {
              processFilesToProject(session.files, session.componentLib)
            }
            const lastAssistant = [...session?.messages || []].reverse().find(m => m.role === 'assistant')
            if (lastAssistant?.stages) {
              const restoredHasInitial = INITIAL_STAGE_KEYS.some(k => lastAssistant.stages?.[k])
              const currentHasInitial = chatStore.stageProgresses.some(s => INITIAL_STAGE_KEYS.includes(s.stageName))
              if (restoredHasInitial === currentHasInitial) {
                const progressStates = stagesToProgressStates(lastAssistant.stages, lastAssistant.stepMessages, lastAssistant.failedStep)
                chatStore.setStageProgresses(progressStates)
              }
            }
            chatStore.updateStageStatus(event.stage, 'running', {
              progressMessage: '',
            })
          })
        } else {
          chatStore.updateStageStatus(event.stage, 'running', {
            progressMessage: '',
          })
        }
      },

      onStageProgress(event) {
        chatStore.updateStageStatus(event.stage, 'running', {
          progressMessage: event.message,
        })
      },

      onStageComplete(event) {
        chatStore.updateStageStatus(event.stage, event.status, {
          duration: event.duration,
          progressMessage: event.message || undefined,
        })

        if (event.filePath) {
          chatStore.setStagePreview(event.stageName, event.filePath)
        }

        scrollToBottom()
      },

      onDone(event) {
        chatStore.currentTaskId = null

        if (chatStore.isRetrying) {
          chatStore.removeLastAssistantMessage(sessionId)
        }

        const fallbackStepMessages: StepMessage[] | undefined =
          event.stepMessages && event.stepMessages.length > 0
            ? undefined
            : buildFallbackStepMessages(chatStore.stageProgresses, chatStore.stagePreviewMap)

        chatStore.addMessageLocal(sessionId, {
          role: 'assistant',
          content: event.message,
          stages: event.stages as any,
          failedStep: event.failedStep,
          stepMessages: event.stepMessages || fallbackStepMessages,
        })

        chatStore.isStreaming = false

        if (event.failedStep != null) {
          ElMessage.warning('生成失败，请点击重试按钮重试')
        } else {
          ElMessage.success('生成成功')
        }

        pendingUserMessage.value = ''
        scrollToBottom()
      },

      onError(event) {
        chatStore.currentTaskId = null
        chatStore.setLoading(false)
        pendingUserMessage.value = ''

        if (chatStore.isRetrying) {
          chatStore.removeLastAssistantMessage(sessionId)
        }

        chatStore.addMessageLocal(sessionId, {
          role: 'assistant',
          content: event.message,
          stages: event.stages as any,
          failedStep: event.failedStep,
          stepMessages: buildFallbackStepMessages(chatStore.stageProgresses, chatStore.stagePreviewMap),
        })

        chatStore.isStreaming = false
        postStreamReloadNeeded.value = true

        ElMessage.error(`生成失败：${event.message}`)
        scrollToBottom()
      },

      onCancelled(event) {
        chatStore.currentTaskId = null
        chatStore.setLoading(false)
        pendingUserMessage.value = ''

        if (chatStore.isRetrying) {
          chatStore.removeLastAssistantMessage(sessionId)
        }

        chatStore.addMessageLocal(sessionId, {
          role: 'assistant',
          content: '已取消生成',
          stages: event.stages as any,
          failedStep: event.cancelledAtStep,
        })

        chatStore.isStreaming = false
        postStreamReloadNeeded.value = true

        ElMessage.info('已取消生成')
        scrollToBottom()
      },
    }
  }

  async function runGeneration(
    stageNames: string[],
    execute: (callbacks: SSECallbacks) => Promise<void>,
    isRetry = false,
    retryFromStep = 0,
  ) {
    chatStore.currentTaskId = null
    chatStore.isStreaming = true
    chatStore.isRetrying = isRetry
    chatStore.retrySessionLoaded = false
    chatStore.setLoading(true)
    chatStore.resetStageProgresses(stageNames)

    if (isRetry && retryFromStep > 0) {
      for (let i = 0; i < retryFromStep; i++) {
        chatStore.updateStageStatus(i, 'success')
      }
      for (let i = retryFromStep; i < stageNames.length; i++) {
        chatStore.stagePreviewMap.delete(stageNames[i])
      }
      chatStore.invalidateStageCache(stageNames.slice(retryFromStep))
    } else if (isRetry) {
      chatStore.stagePreviewMap.clear()
      chatStore.invalidateStageCache(stageNames)
    } else {
      chatStore.stagePreviewMap.clear()
    }

    const callbacks = buildCallbacks(chatStore.currentSessionId!)

    postStreamReloadNeeded.value = false

    try {
      await execute(callbacks)
    } catch (error) {
      ElMessage.error('生成失败: ' + (error as Error).message)
      chatStore.isStreaming = false
      chatStore.currentTaskId = null
      chatStore.setLoading(false)
      postStreamReloadNeeded.value = true
    } finally {
      if (postStreamReloadNeeded.value && chatStore.currentSessionId) {
        await chatStore.loadSession(chatStore.currentSessionId)
      }
      chatStore.setLoading(false)
      chatStore.isRetrying = false
      chatStore.retrySessionLoaded = false
      pendingUserMessage.value = ''
      scrollToBottom()
    }
  }

  async function sendMessage() {
    const message = inputMessage.value.trim()
    if (!message || isLoading.value || chatStore.isStreaming) return

    inputMessage.value = ''
    let sessionId = chatStore.currentSessionId
    if (!sessionId) {
      sessionId = await chatStore.createSessionRemote(message)
      if (!sessionId) return
    }

    const attachmentsToSend = currentAttachments.value.length > 0 ? [...currentAttachments.value] : undefined
    currentAttachments.value = []

    pendingUserMessage.value = message
    scrollToBottom()

    try {
      await chatStore.addMessageRemote(sessionId, {
        role: 'user',
        content: message,
        attachments: attachmentsToSend,
      })

      const hasExistingFiles = chatStore.currentSession?.files && chatStore.currentSession.files.length > 0
      const isNewSession = !hasExistingFiles

      const stageNames = isNewSession
        ? [...INITIAL_STAGE_KEYS]
        : ['iteration']

      if (isNewSession) {
        await runGeneration(stageNames, (callbacks) =>
          generateInitialStream(
            {
              prompt: message,
              sessionId,
              debug: false,
              componentLib: chatStore.currentSession?.componentLib,
              attachments: attachmentsToSend,
            },
            callbacks,
          ),
        )
      } else {
        await runGeneration(stageNames, (callbacks) =>
          generateIterateStream(
            {
              prompt: message,
              sessionId,
              files: chatStore.currentSession!.files!,
            },
            callbacks,
          ),
        )
      }
    } catch {
      // errors handled by runGeneration
    }
  }

  async function handleRetryFromStage(stage: number, message?: ChatMessage) {
    const sessionId = chatStore.currentSessionId
    const session = chatStore.currentSession
    if (!sessionId || !session || chatStore.isStreaming) return
    chatStore.isRetrying = true
    chatStore.retrySessionLoaded = false

    chatStore.removeLastAssistantMessage(sessionId, true)

    const msgStages = message?.stages
    const isIteration = msgStages
      ? !INITIAL_STAGE_KEYS.some(k => (msgStages as any)?.[k])
      : chatStore.stageProgresses.length > 0 && !INITIAL_STAGE_KEYS.includes(chatStore.stageProgresses[0].stageName)

    if (isIteration) {
      chatStore.removeLastAssistantMessage(sessionId)

      const msgIndex = message ? session.messages.indexOf(message) : -1
      const userMessage = msgIndex >= 0
        ? session.messages.slice(0, msgIndex).reverse().find(m => m.role === 'user')
        : session.messages.filter(m => m.role === 'user').at(-1)
      if (!userMessage) return

      await runGeneration(['iteration'], (callbacks) =>
        generateIterateStream(
          {
            prompt: userMessage.content,
            sessionId,
            files: session.files!,
            fromStep: 0,
          },
          callbacks,
        ),
        true,
        0,
      )
    } else {
      const firstUserMessage = session.messages.find(m => m.role === 'user')
      if (!firstUserMessage) return

      await runGeneration([...INITIAL_STAGE_KEYS], (callbacks) =>
        generateInitialStream(
          {
            prompt: firstUserMessage.content,
            sessionId,
            componentLib: session.componentLib,
            attachments: firstUserMessage.attachments,
            fromStep: stage,
          },
          callbacks,
        ),
        true,
        stage,
      )
    }
  }

  function handleStageClick(stage: StageProgressState, message?: ChatMessage) {
    if (INITIAL_STAGE_KEYS.includes(stage.stageName)) {
      chatStore.setActiveStageTab(stage.stageName)
      return
    }

    const session = chatStore.currentSession
    if (session && message?.stepMessages) {
      const allOutputs = session.messages.flatMap(m => m.stepMessages || [])
      const sameNameOutputs = allOutputs.filter(o => o.stageName === stage.stageName)
      if (sameNameOutputs.length > 1) {
        const msgOutput = message.stepMessages.find(o => o.stageName === stage.stageName)
        if (msgOutput) {
          const idx = sameNameOutputs.indexOf(msgOutput) + 1
          chatStore.setActiveStageTab(`${stage.stageName}_${idx}`)
          return
        }
      }
    }
    chatStore.setActiveStageTab(stage.stageName)
  }

  return {
    inputMessage,
    pendingUserMessage,
    currentAttachments,
    isLoading,
    messagesContainer,
    sendMessage,
    handleRetryFromStage,
    handleStageClick,
  }
}
