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
      </div>
      <el-tag v-if="currentSession" size="small" type="info">
        {{ currentSession.messages.length }} 条消息
      </el-tag>
    </div>

    <div class="flex-1 overflow-y-auto p-4" ref="messagesContainer">
      <template v-if="sessionMessages.length || chatStore.isStreaming">
        <template v-for="(message, idx) in sessionMessages" :key="message.id">
          <UserMessageBubble v-if="message.role === 'user'" :message="message" />

          <AssistantMessageBubble
            v-else-if="message.role === 'assistant'"
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

        <StreamingBubble
          v-if="showStreamingBubble"
          :stages="chatStore.stageProgresses"
          :is-streaming="true"
          :retry-fn="handleRetryFromStage"
          :cancel-fn="chatStore.cancelStreaming"
          :label="streamingBubbleLabel"
          @stage-click="handleStageClick"
        />

        <div v-if="showPendingLoading" class="px-11 mb-5">
          <div class="px-4 py-3 rounded-xl bg-gray-100 inline-flex items-center">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span class="ml-2 text-gray-500">正在生成...</span>
          </div>
        </div>
      </template>

      <div v-else-if="isLoading && pendingUserMessage" class="flex flex-col gap-3">
        <div class="flex gap-3 flex-row-reverse">
          <div class="flex-shrink-0">
            <el-avatar :size="32" style="background: #409eff">U</el-avatar>
          </div>
          <div class="px-4 py-3 rounded-xl bg-blue-500 text-white">{{ pendingUserMessage }}</div>
        </div>
        <StreamingBubble
          v-if="chatStore.isStreaming || chatStore.stageProgresses.length > 0"
          :stages="chatStore.stageProgresses"
          :is-streaming="chatStore.isStreaming"
          :retry-fn="handleRetryFromStage"
          :cancel-fn="chatStore.cancelStreaming"
          label="正在生成..."
          @stage-click="handleStageClick"
        />
        <div v-else class="px-11">
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
      v-model="inputMessage"
      :placeholder="placeholder"
      :loading="isLoading"
      :streaming="chatStore.isStreaming"
      @send="sendMessage"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, onUnmounted } from 'vue'
import { DArrowRight, Loading } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import type { StageProgressState, ChatMessage } from '@/types'
import StreamingBubble from '@/components/StreamingBubble.vue'
import UserMessageBubble from '@/components/UserMessageBubble.vue'
import AssistantMessageBubble from '@/components/AssistantMessageBubble.vue'
import ChatInput from '@/components/ChatInput.vue'
import { useStageProgress } from '@/composables/useStageProgress'
import { useGeneration } from '@/composables/useGeneration'

defineProps<{
  historyCollapsed?: boolean
}>()

defineEmits<{
  'toggle-history': []
}>()

const chatStore = useChatStore()

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

const {
  inputMessage,
  pendingUserMessage,
  currentAttachments,
  isLoading,
  messagesContainer,
  sendMessage,
  handleRetryFromStage,
  handleStageClick,
} = useGeneration(scrollToBottom)

const showPendingLoading = computed(() =>
  isLoading.value
  && !chatStore.isStreaming
  && chatStore.currentSession?.messages.length === 0
  && pendingUserMessage.value
)

watch(currentSession, () => {
  scrollToBottom()
})

watch(() => chatStore.pendingPrompt, (prompt) => {
  if (prompt && prompt.trim()) {
    chatStore.setPendingPrompt(null)
    inputMessage.value = prompt

    if (chatStore.pendingAttachments.length > 0) {
      currentAttachments.value = [...chatStore.pendingAttachments]
      chatStore.clearPendingAttachments()
    }

    sendMessage()
  }
}, { immediate: true })

onUnmounted(() => {
  chatStore.cancelStreaming()
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
