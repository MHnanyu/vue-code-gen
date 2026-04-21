<template>
  <div class="h-full flex flex-col bg-white">
    <div class="flex justify-between items-center px-4 py-4 border-b border-gray-200">
      <div class="flex items-center gap-2">
        <el-button
          v-if="historyCollapsed"
          text
          size="small"
          @click="$emit('toggle-history')"
          title="展开历史记录"
        >
          <el-icon><DArrowRight /></el-icon>
        </el-button>
        <h3 class="m-0 text-base text-gray-800">AI 对话</h3>
        <el-tag
          v-if="currentSession?.mode"
          size="small"
          :type="currentSession.mode === 'agent' ? 'warning' : 'success'"
          effect="plain"
        >
          {{ currentSession.mode === 'agent' ? 'Agent' : 'Pipeline' }}
        </el-tag>
      </div>
      <el-tag v-if="currentSession" size="small" type="info">
        {{ currentSession.messages.length }} 条消息
      </el-tag>
    </div>

    <div class="flex-1 overflow-y-auto p-4" ref="messagesContainer">
      <template v-if="sessionMessages.length || chatStore.isStreaming || agentState.isStreaming">
        <template v-for="(message, idx) in sessionMessages" :key="message.id">
          <UserMessageBubble v-if="message.role === 'user'" :message="message" />

          <template v-else-if="message.role === 'assistant'">
            <AgentMessageBubble
              v-if="isAgentMode && (message.agentMetadata || message.content === '正在生成中...' || message.content === 'Agent 模式生成完成' || message.content.startsWith('Agent 执行异常') || message.content === '用户取消了生成')"
              :message="message"
              @view-output="handleViewOutput"
              @retry="agent.retryAgentGeneration()"
            />
            <AssistantMessageBubble
              v-else
              :message="message"
              :index="idx"
              :show-progress="shouldShowMessageProgress(message, idx)"
              :progress-stages="getMessageProgress(message, idx)"
              :is-last="isLastAssistantMessage(idx)"
              :is-retrying="chatStore.isRetrying"
              :is-streaming="chatStore.isStreaming"
              :show-error="showErrorMessage(message, idx)"
              :retry-fn="getRetryFn(idx, message)"
              @stage-click="(stage: StageProgressState) => handleStageClick(stage, message)"
            />
          </template>
        </template>

        <template v-if="isAgentMode">
          <AgentStreamingBubble
            v-if="agentState.isStreaming"
            :is-streaming="agentState.isStreaming"
            :thinking-content="agentState.thinkingContent"
            :tool-calls="agentState.toolCalls"
            :is-done="agentState.isDone"
            :error-message="agentState.errorMessage"
            :cancel-fn="agentState.cancelStreaming"
            @view-output="handleViewOutput"
            @retry="agent.retryAgentGeneration()"
          />
        </template>
        <template v-else>
          <StreamingBubble
            v-if="showStreamingBubble"
            :stages="chatStore.stageProgresses"
            :is-streaming="true"
            :retry-fn="handleRetryFromStage"
            :cancel-fn="chatStore.cancelStreaming"
            :label="streamingBubbleLabel"
            @stage-click="handleStageClick"
          />
        </template>

        <div v-if="showPendingLoading" class="px-11 mb-5">
          <div class="px-4 py-3 rounded-xl bg-gray-100 inline-flex items-center">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span class="ml-2 text-gray-500">正在生成...</span>
          </div>
        </div>
      </template>

      <div v-else-if="currentLoading && pendingUserMessage" class="flex flex-col gap-3">
        <div class="flex gap-3 flex-row-reverse">
          <div class="flex-shrink-0">
            <el-avatar :size="32" style="background: #409eff">U</el-avatar>
          </div>
          <div class="px-4 py-3 rounded-xl bg-blue-500 text-white">{{ pendingUserMessage }}</div>
        </div>
        <template v-if="isAgentMode">
          <AgentStreamingBubble
            v-if="agentState.isStreaming"
            :is-streaming="agentState.isStreaming"
            :thinking-content="agentState.thinkingContent"
            :tool-calls="agentState.toolCalls"
            :is-done="agentState.isDone"
            :error-message="agentState.errorMessage"
            :cancel-fn="agentState.cancelStreaming"
            @view-output="handleViewOutput"
            @retry="agent.retryAgentGeneration()"
          />
        </template>
        <template v-else>
          <StreamingBubble
            v-if="chatStore.isStreaming || chatStore.stageProgresses.length > 0"
            :stages="chatStore.stageProgresses"
            :is-streaming="chatStore.isStreaming"
            :retry-fn="handleRetryFromStage"
            :cancel-fn="chatStore.cancelStreaming"
            label="正在生成..."
            @stage-click="handleStageClick"
          />
        </template>
        <div v-if="!agentState.isStreaming && !chatStore.isStreaming && !chatStore.stageProgresses.length" class="px-11">
          <div class="px-4 py-3 rounded-xl bg-gray-100 inline-flex items-center">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span class="ml-2 text-gray-500">正在生成...</span>
          </div>
        </div>
      </div>
      <el-empty v-else description="开始新的对话吧" :image-size="80" class="empty-box">
        <template #image>
          <span class="text-5xl">💬</span>
        </template>
      </el-empty>
    </div>

    <ChatInput
      v-model="currentInputMessage"
      :placeholder="placeholder"
      :loading="currentLoading"
      :streaming="chatStore.isStreaming || agentState.isStreaming"
      @send="currentSendMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, onUnmounted, ref } from 'vue'
import { DArrowRight, Loading } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import type { StageProgressState, ChatMessage } from '@/types'
import StreamingBubble from '@/components/StreamingBubble.vue'
import UserMessageBubble from '@/components/UserMessageBubble.vue'
import AssistantMessageBubble from '@/components/AssistantMessageBubble.vue'
import ChatInput from '@/components/ChatInput.vue'
import AgentStreamingBubble from '@/components/agent/AgentStreamingBubble.vue'
import AgentMessageBubble from '@/components/agent/AgentMessageBubble.vue'
import { useStageProgress } from '@/composables/useStageProgress'
import { useGeneration } from '@/composables/useGeneration'
import { useAgentGeneration } from '@/composables/useAgentGeneration'
import { fetchStageFile } from '@/api'

defineProps<{
  historyCollapsed?: boolean
}>()

defineEmits<{
  'toggle-history': []
}>()

const chatStore = useChatStore()
const agentState = chatStore.agentState

const {
  isLastAssistantMessage,
  shouldShowMessageProgress,
  getMessageProgress,
  showErrorMessage,
  showStreamingBubble,
  streamingBubbleLabel,
} = useStageProgress()

const currentSession = computed(() => chatStore.currentSession)
const sessionMessages = computed(() => currentSession.value?.messages ?? [])
const isAgentMode = computed(() => currentSession.value?.mode === 'agent')

const placeholder = computed(() =>
  currentSession.value
    ? '继续描述您的需求，或提出修改建议...'
    : '输入您的需求，开始生成代码...'
)

function getRetryFn(idx: number, message: ChatMessage): ((stage: number) => void) | undefined {
  if (!isLastAssistantMessage(idx) || chatStore.isStreaming) return undefined
  return (stage: number) => handleRetryFromStage(stage, message)
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const messagesContainer = ref<HTMLElement | null>(null)

const pipeline = useGeneration(scrollToBottom)
const agent = useAgentGeneration(scrollToBottom)

const currentInputMessage = computed({
  get: () => isAgentMode.value ? agent.inputMessage.value : pipeline.inputMessage.value,
  set: (val) => {
    if (isAgentMode.value) {
      agent.inputMessage.value = val
    } else {
      pipeline.inputMessage.value = val
    }
  },
})

const currentLoading = computed(() => isAgentMode.value ? agent.isLoading.value : pipeline.isLoading.value)
const pendingUserMessage = computed(() => isAgentMode.value ? agent.pendingUserMessage.value : pipeline.pendingUserMessage.value)

function currentSendMessage() {
  if (isAgentMode.value) {
    agent.sendMessage()
  } else {
    pipeline.sendMessage()
  }
}

function handleRetryFromStage(stage: number, message?: ChatMessage) {
  pipeline.handleRetryFromStage(stage, message)
}

function handleStageClick(stage: StageProgressState, message?: ChatMessage) {
  pipeline.handleStageClick(stage, message)
}

function handleViewOutput(url: string) {
  fetchStageFile(url).then(content => {
    console.log('[Agent Output]', content)
  }).catch(e => {
    console.error('Failed to load output:', e)
  })
}

const showPendingLoading = computed(() => {
  const loading = isAgentMode.value ? agent.isLoading.value : pipeline.isLoading.value
  const streaming = isAgentMode.value ? agentState.isStreaming : chatStore.isStreaming
  return loading
    && !streaming
    && currentSession.value?.messages.length === 0
    && pendingUserMessage.value
})

watch(currentSession, () => {
  scrollToBottom()
})

watch(() => chatStore.pendingPrompt, (prompt) => {
  if (prompt && prompt.trim()) {
    chatStore.setPendingPrompt(null)

    if (isAgentMode.value) {
      agent.inputMessage.value = prompt
      if (chatStore.pendingAttachments.length > 0) {
        agent.currentAttachments.value = [...chatStore.pendingAttachments]
        chatStore.clearPendingAttachments()
      }
      agent.sendMessage()
    } else {
      pipeline.inputMessage.value = prompt
      if (chatStore.pendingAttachments.length > 0) {
        pipeline.currentAttachments.value = [...chatStore.pendingAttachments]
        chatStore.clearPendingAttachments()
      }
      pipeline.sendMessage()
    }
  }
}, { immediate: true })

onUnmounted(() => {
  chatStore.cancelStreaming()
  agentState.cancelStreaming()
})
</script>

<style scoped>
.empty-box :deep(.el-empty) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
