import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chat'
import { useProjectStore } from '@/stores/project'
import { generateAgentStream, type AgentSSECallbacks, type Attachment, fetchStageFile } from '@/api'
import type { AgentFileItem } from '@/types'
import { AGENT_OUTPUT_URL_TOOLS } from '@/constants/agent'

export function useAgentGeneration(scrollToBottom: () => void) {
  const chatStore = useChatStore()
  const agentState = chatStore.agentState

  const inputMessage = ref('')
  const pendingUserMessage = ref('')
  const currentAttachments = ref<Attachment[]>([])
  const postStreamReloadNeeded = ref(false)

  const isLoading = computed(() => chatStore.isLoading)

  function buildCallbacks(sessionId: string): AgentSSECallbacks {
    return {
      onAgentThinking(event) {
        if (!agentState.currentTaskId) {
          agentState.currentTaskId = event.taskId
        }
        agentState.appendThinking(event.content)
        scrollToBottom()
      },

      onToolCallStart(event) {
        agentState.addToolCall(event.toolName, event.step, event.arguments)
        scrollToBottom()
      },

      async onToolCallResult(event) {
        const isFailed = event.status === 'failed' || !!event.error || !!event.result?.error

        if (isFailed) {
          agentState.failToolCall(event.toolName, event.result, event.error || event.result?.error)
          scrollToBottom()
          return
        }

        const hasOutput = event.outputUrls && event.outputUrls.length > 0 && AGENT_OUTPUT_URL_TOOLS.has(event.toolName)
        if (hasOutput) {
          agentState.completeToolCall(event.toolName, event.outputUrls, event.outputType, event.result)

          if (event.outputType === 'file') {
            try {
              const content = await fetchStageFile(event.outputUrls[0])
              agentState.setToolCallContent(event.toolName, { type: 'markdown', content, files: null })
            } catch (e) {
              console.error(`Failed to fetch agent tool output for ${event.toolName}:`, e)
            }
          } else if (event.outputType === 'files') {
            try {
              const fetchResults = await Promise.allSettled(
                event.outputUrls.map(async (url) => {
                  const code = await fetchStageFile(url)
                  const fileName = url.split('/').pop() || 'Unknown.vue'
                  return {
                    id: `agent_${url}`,
                    name: fileName,
                    path: url,
                    type: 'file' as const,
                    language: 'vue' as const,
                    content: code,
                  }
                }),
              )
              const apiFiles = fetchResults
                .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
                .map(r => r.value)

              agentState.setToolCallContent(event.toolName, { type: 'vue', content: null, files: apiFiles })

              const projectStore = useProjectStore()
              projectStore.setFilesFromApiFiles(apiFiles, chatStore.currentSession?.componentLib)
              if (chatStore.currentSessionId) {
                chatStore.updateSessionFiles(chatStore.currentSessionId, apiFiles)
              }
            } catch (e) {
              console.error(`Failed to fetch agent tool files for ${event.toolName}:`, e)
            }
          }
        } else {
          agentState.completeToolCall(event.toolName, [], null, event.result)
        }
        scrollToBottom()
      },

      onToolCallError(event) {
        agentState.failToolCall(event.toolName, { error: event.error }, event.error)
        scrollToBottom()
      },

      async onAgentDone(_event) {
        agentState.isDone = true
      },

      async onAgentFiles(event) {
        agentState.agentFiles = event.files
        agentState.currentTaskId = null
        agentState.isStreaming = false

        const sessionFiles: any[] = []
        for (const file of event.files) {
          try {
            const code = await fetchStageFile(file.downloadUrl)
            sessionFiles.push({
              name: file.name,
              path: file.path,
              type: 'file',
              language: 'vue' as const,
              content: code,
            })
          } catch (e) {
            console.error(`Failed to fetch agent file ${file.name}:`, e)
          }
        }

        if (sessionFiles.length > 0) {
          chatStore.updateSessionFiles(sessionId, sessionFiles)
          const projectStore = useProjectStore()
          projectStore.setFilesFromApiFiles(sessionFiles, chatStore.currentSession?.componentLib)
        }

        const content = 'Agent 模式生成完成'
        chatStore.addMessageLocal(sessionId, {
          role: 'assistant',
          content,
          agentMetadata: {
            thinkingContent: agentState.thinkingContent,
            toolCalls: agentState.toolCalls.map(tc => ({
              toolName: tc.toolName,
              label: tc.label,
              status: tc.status,
              step: tc.step,
              outputUrls: tc.outputUrls,
              outputType: tc.outputType,
              arguments: tc.arguments,
              result: tc.result,
            })),
            files: event.files.map((f: AgentFileItem) => ({
              name: f.name,
              path: f.path,
              lines: f.lines,
              sizeBytes: f.sizeBytes,
            })),
          },
        })

        ElMessage.success('生成成功')
        pendingUserMessage.value = ''
        scrollToBottom()
      },

      onAgentCancelled(event) {
        agentState.currentTaskId = null
        agentState.isStreaming = false
        agentState.cancelledStep = event.cancelledAtStep

        chatStore.addMessageLocal(sessionId, {
          role: 'assistant',
          content: '用户取消了生成',
          agentMetadata: {
            thinkingContent: agentState.thinkingContent,
            toolCalls: agentState.toolCalls.map(tc => ({
              toolName: tc.toolName,
              label: tc.label,
              status: tc.status,
              step: tc.step,
              outputUrls: tc.outputUrls,
              outputType: tc.outputType,
              arguments: tc.arguments,
              result: tc.result,
            })),
          },
        })

        ElMessage.info('已取消生成')
        scrollToBottom()
      },

      onAgentError(event) {
        agentState.currentTaskId = null
        agentState.isStreaming = false
        agentState.errorMessage = event.message
        agentState.failedStep = event.failedStep

        chatStore.addMessageLocal(sessionId, {
          role: 'assistant',
          content: `Agent 执行异常: ${event.message}`,
          agentMetadata: {
            thinkingContent: agentState.thinkingContent,
            toolCalls: agentState.toolCalls.map(tc => ({
              toolName: tc.toolName,
              label: tc.label,
              status: tc.status,
              step: tc.step,
              outputUrls: tc.outputUrls,
              outputType: tc.outputType,
              arguments: tc.arguments,
              result: tc.result,
            })),
          },
        })

        ElMessage.error(`生成失败：${event.message}`)
        scrollToBottom()
      },
    }
  }

  async function runAgentGeneration(sessionId: string, message: string, attachments?: Attachment[]): Promise<void> {
    agentState.reset()
    agentState.isStreaming = true
    chatStore.setLoading(true)

    const callbacks = buildCallbacks(sessionId)
    postStreamReloadNeeded.value = false

    try {
      await generateAgentStream(
        {
          prompt: message,
          sessionId,
          componentLib: chatStore.currentSession?.componentLib,
          attachments,
          debug: false,
        },
        callbacks,
      )
    } catch (error) {
      agentState.isStreaming = false
      agentState.currentTaskId = null
      chatStore.setLoading(false)
      postStreamReloadNeeded.value = true
      ElMessage.error('生成失败: ' + (error as Error).message)
    } finally {
      if (postStreamReloadNeeded.value && chatStore.currentSessionId) {
        await chatStore.loadSession(chatStore.currentSessionId)
      }
      chatStore.setLoading(false)
      agentState.isStreaming = false
      pendingUserMessage.value = ''
      scrollToBottom()
    }
  }

  async function retryAgentGeneration(fromStep = 0) {
    const sessionId = chatStore.currentSessionId
    const session = chatStore.currentSession
    if (!sessionId || !session || agentState.isStreaming) return

    agentState.isRetrying = true

    chatStore.removeLastAssistantMessage(sessionId, true)

    const lastUserMessage = [...session.messages].reverse().find(m => m.role === 'user')
    if (!lastUserMessage) {
      agentState.isRetrying = false
      return
    }

    agentState.reset()
    agentState.isStreaming = true
    chatStore.setLoading(true)

    const callbacks = buildCallbacks(sessionId)
    postStreamReloadNeeded.value = false

    try {
      await generateAgentStream(
        {
          prompt: lastUserMessage.content,
          sessionId,
          componentLib: chatStore.currentSession?.componentLib,
          fromStep,
        },
        callbacks,
      )
    } catch (error) {
      agentState.isStreaming = false
      agentState.currentTaskId = null
      chatStore.setLoading(false)
      postStreamReloadNeeded.value = true
      ElMessage.error('生成失败: ' + (error as Error).message)
    } finally {
      if (postStreamReloadNeeded.value && chatStore.currentSessionId) {
        await chatStore.loadSession(chatStore.currentSessionId)
      }
      chatStore.setLoading(false)
      agentState.isStreaming = false
      agentState.isRetrying = false
      pendingUserMessage.value = ''
      scrollToBottom()
    }
  }

  async function sendMessage() {
    const message = inputMessage.value.trim()
    if (!message || isLoading.value || agentState.isStreaming) return

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

      await runAgentGeneration(sessionId, message, attachmentsToSend)
    } catch {
      // errors handled by runAgentGeneration
    }
  }

  return {
    inputMessage,
    pendingUserMessage,
    currentAttachments,
    isLoading,
    sendMessage,
    retryAgentGeneration,
    agentState,
  }
}
