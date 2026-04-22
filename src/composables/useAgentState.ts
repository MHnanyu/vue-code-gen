import { ref, computed } from 'vue'
import { cancelGeneration as apiCancelGeneration } from '@/api'
import type { AgentToolCallState } from '@/types'
import { buildCallingLabel, buildCompletedLabel, buildFailedLabel } from '@/constants/agent'

export interface ToolCallContent {
  type: 'markdown' | 'vue'
  content: string | null
  files: any[] | null
}

export function useAgentState() {
  const isStreaming = ref(false)
  const isRetrying = ref(false)
  const currentTaskId = ref<string | null>(null)
  const thinkingContent = ref('')
  const toolCalls = ref<AgentToolCallState[]>([])
  const toolCallContents = ref<Map<string, ToolCallContent>>(new Map())
  const agentFiles = ref<any[]>([])
  const isDone = ref(false)
  const errorMessage = ref<string | null>(null)

  const currentToolCall = computed(() =>
    toolCalls.value.find(t => t.status === 'calling') ?? null
  )

  const isCompleted = computed(() => isDone.value || !!errorMessage.value)

  function appendThinking(text: string) {
    thinkingContent.value += text
  }

  function addToolCall(toolCallId: string, toolName: string, arguments_?: string): void {
    toolCalls.value.push({
      toolCallId,
      toolName,
      status: 'calling',
      label: buildCallingLabel(toolName, arguments_),
      outputPaths: null,
      renderType: null,
      arguments: arguments_,
    })
  }

  function completeToolCall(
    toolCallId: string,
    toolName: string,
    outputPaths: string[] | null,
    renderType: 'text' | 'code' | null,
    result?: Record<string, any>,
    message?: string,
    duration?: number,
  ): void {
    const tc = toolCalls.value.find(t => t.toolCallId === toolCallId && t.status === 'calling')
    if (tc) {
      tc.status = 'completed'
      tc.label = buildCompletedLabel(toolName, result, message, outputPaths, duration)
      tc.outputPaths = outputPaths
      tc.renderType = renderType
      tc.message = message
      tc.duration = duration
      if (result) tc.result = result
    }
  }

  function failToolCall(toolCallId: string, toolName: string, message?: string): void {
    const tc = toolCalls.value.find(t => t.toolCallId === toolCallId && t.status === 'calling')
    if (tc) {
      tc.status = 'failed'
      tc.label = buildFailedLabel(toolName, message)
      if (message) tc.message = message
    }
  }

  function setToolCallContent(toolName: string, content: ToolCallContent): void {
    toolCallContents.value.set(toolName, content)
  }

  function reset(): void {
    thinkingContent.value = ''
    toolCalls.value = []
    toolCallContents.value.clear()
    agentFiles.value = []
    isDone.value = false
    errorMessage.value = null
  }

  function cancelStreaming(): void {
    if (!currentTaskId.value || !isStreaming.value) return
    apiCancelGeneration(currentTaskId.value).catch((e) => {
      console.error('Cancel agent generation failed:', e)
    })
  }

  return {
    isStreaming,
    isRetrying,
    currentTaskId,
    thinkingContent,
    toolCalls,
    toolCallContents,
    agentFiles,
    isDone,
    errorMessage,
    currentToolCall,
    isCompleted,
    appendThinking,
    addToolCall,
    completeToolCall,
    setToolCallContent,
    failToolCall,
    reset,
    cancelStreaming,
  }
}
