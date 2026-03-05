<template>
  <div class="chat-panel">
    <div class="chat-header">
      <h3>AI 对话</h3>
      <el-tag v-if="currentSession" size="small" type="info">
        {{ currentSession.messages.length }} 条消息
      </el-tag>
    </div>

    <div class="chat-messages" ref="messagesContainer">
      <template v-if="currentSession?.messages.length">
        <div
          v-for="message in currentSession.messages"
          :key="message.id"
          class="message"
          :class="message.role"
        >
          <div class="message-avatar">
            <el-avatar :size="32" :style="{ background: message.role === 'user' ? '#409eff' : '#67c23a' }">
              {{ message.role === 'user' ? 'U' : 'AI' }}
            </el-avatar>
          </div>
          <div class="message-content">
            <div class="message-text">{{ message.content }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </template>
      <el-empty v-else description="开始新的对话吧" :image-size="80">
        <template #image>
          <span style="font-size: 48px">💬</span>
        </template>
      </el-empty>
    </div>

    <div class="chat-input">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="3"
        :placeholder="placeholder"
        resize="none"
        @keydown.enter.ctrl="sendMessage"
      />
      <div class="input-actions">
        <span class="hint">Ctrl + Enter 发送</span>
        <el-button type="primary" :loading="isLoading" :disabled="!inputMessage.trim()" @click="sendMessage">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useProjectStore } from '@/stores/project'
import { generateMockComponent, generateMockAIResponse, delay } from '@/api/mock'

const props = defineProps<{
  initialPrompt?: string
}>()

const emit = defineEmits<{
  generated: []
}>()

const chatStore = useChatStore()
const projectStore = useProjectStore()

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const currentSession = computed(() => chatStore.currentSession)
const isLoading = computed(() => chatStore.isLoading)

const placeholder = computed(() =>
  currentSession.value
    ? '继续描述您的需求，或提出修改建议...'
    : '输入您的需求，开始生成代码...'
)

watch(currentSession, () => {
  scrollToBottom()
})

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

async function sendMessage() {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return

  inputMessage.value = ''

  // 如果没有当前会话，创建一个新的
  let sessionId = chatStore.currentSessionId
  if (!sessionId) {
    const session = chatStore.createSession(message)
    sessionId = session.id
  }

  // 添加用户消息
  chatStore.addMessage(sessionId, { role: 'user', content: message })
  scrollToBottom()

  // 设置加载状态
  chatStore.setLoading(true)

  // 模拟AI响应延迟
  await delay(1500)

  // 生成组件代码
  const componentCode = generateMockComponent(message)
  projectStore.setComponentCode(componentCode)

  // 添加AI回复
  const aiResponse = generateMockAIResponse(message)
  chatStore.addMessage(sessionId, { role: 'assistant', content: aiResponse })

  chatStore.setLoading(false)
  scrollToBottom()

  emit('generated')
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 处理初始提示
watch(() => props.initialPrompt, (prompt) => {
  if (prompt && prompt.trim()) {
    inputMessage.value = prompt
    sendMessage()
  }
}, { immediate: true })
</script>

<style scoped>
.chat-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 80%;
}

.message.user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  background: #f5f7fa;
  line-height: 1.6;
  word-break: break-word;
}

.message.user .message-text {
  background: #409eff;
  color: white;
}

.message-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid #eee;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.hint {
  font-size: 12px;
  color: #909399;
}

:deep(.el-empty) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
