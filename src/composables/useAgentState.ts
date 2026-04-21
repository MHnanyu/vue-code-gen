import { ref, computed } from 'vue'
import { cancelGeneration as apiCancelGeneration } from '@/api'
import type { AgentToolCallState } from '@/types'
import { AGENT_TOOL_LABELS } from '@/constants/agent'

export function useAgentState() {
  const isStreaming = ref(false)
  const isRetrying = ref(false)
  const currentTaskId = ref<string | null>(null)
  const thinkingContent = ref('')
  const toolCalls = ref<AgentToolCallState[]>([])
  const agentFiles = ref<any[]>([])
  const isDone = ref(false)
  const errorMessage = ref<string | null>(null)
  const failedStep = ref<number | null>(null)
  const cancelledStep = ref<number | null>(null)

  const currentToolCall = computed(() =>
    toolCalls.value.find(t => t.status === 'calling') ?? null
  )

  const isCompleted = computed(() => isDone.value || !!errorMessage.value || cancelledStep.value !== null)

  function appendThinking(text: string) {
    thinkingContent.value += text
  }

  function addToolCall(toolName: string, step: number): void {
    toolCalls.value.push({
      toolName,
      status: 'calling',
      step,
      label: AGENT_TOOL_LABELS[toolName] || toolName,
      outputUrl: null,
    })
  }

  function completeToolCall(toolName: string, outputUrl: string | null): void {
    const tc = toolCalls.value.find(t => t.toolName === toolName && t.status === 'calling')
    if (tc) {
      tc.status = 'completed'
      tc.outputUrl = outputUrl
    }
  }

  function failToolCall(toolName: string): void {
    const tc = toolCalls.value.find(t => t.toolName === toolName && t.status === 'calling')
    if (tc) {
      tc.status = 'failed'
    }
  }

  function reset(): void {
    thinkingContent.value = ''
    toolCalls.value = []
    agentFiles.value = []
    isDone.value = false
    errorMessage.value = null
    failedStep.value = null
    cancelledStep.value = null
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
    agentFiles,
    isDone,
    errorMessage,
    failedStep,
    cancelledStep,
    currentToolCall,
    isCompleted,
    appendThinking,
    addToolCall,
    completeToolCall,
    failToolCall,
    reset,
    cancelStreaming,
  }
}
