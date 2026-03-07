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
      <template v-if="currentSession?.messages.length">
        <div
          v-for="message in currentSession.messages"
          :key="message.id"
          class="flex gap-3 mb-5"
          :class="message.role === 'user' ? 'flex-row-reverse' : ''"
        >
          <div class="flex-shrink-0">
            <el-avatar :size="32" :style="{ background: message.role === 'user' ? '#409eff' : '#67c23a' }">
              {{ message.role === 'user' ? 'U' : 'AI' }}
            </el-avatar>
          </div>
          <div 
            class="max-w-[80%]"
            :class="message.role === 'user' ? 'flex flex-col items-end' : ''"
          >
            <div 
              class="px-4 py-3 rounded-xl leading-relaxed break-words"
              :class="message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100'"
            >
              {{ message.content }}
            </div>
            <div class="text-xs text-gray-400 mt-1">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
      </template>
      <el-empty v-else description="开始新的对话吧" :image-size="80">
        <template #image>
          <span class="text-5xl">💬</span>
        </template>
      </el-empty>
    </div>

    <div class="px-4 py-4 border-t border-gray-200">
      <el-input
        v-model="inputMessage"
        type="textarea"
        :rows="3"
        :placeholder="placeholder"
        resize="none"
        @keydown.enter.ctrl="sendMessage"
      />
      <div class="flex justify-between items-center mt-3">
        <span class="text-xs text-gray-400">Ctrl + Enter 发送</span>
        <el-button type="primary" :loading="isLoading" :disabled="!inputMessage.trim()" @click="sendMessage">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { DArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chat'
import { useProjectStore } from '@/stores/project'
import { generateCode, transformApiFiles } from '@/api'
import { buildProjectFiles } from '@/templates/project-template'
import type { ProjectFile } from '@/types'

const props = defineProps<{
  historyCollapsed?: boolean
}>()

const emit = defineEmits<{
  generated: []
  'toggle-history': []
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

watch(() => chatStore.pendingPrompt, (prompt) => {
  if (prompt && prompt.trim()) {
    chatStore.setPendingPrompt(null)
    inputMessage.value = prompt
    sendMessage()
  }
}, { immediate: true })

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

  let sessionId = chatStore.currentSessionId
  if (!sessionId) {
    sessionId = await chatStore.createSessionRemote(message)
    if (!sessionId) return
  }

  chatStore.addMessageLocal(sessionId, { role: 'user', content: message })
  scrollToBottom()

  chatStore.setLoading(true)

  try {
    const result = await generateCode({
      prompt: message,
      componentLib: 'ElementUI',
      sessionId,
    })

    const mainPageContent = result.files[0]?.content || ''
    const extraFiles: ProjectFile[] = result.files.slice(1).map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      type: f.type as 'file',
      language: f.language as ProjectFile['language'],
      content: f.content,
    }))
    const projectFiles = buildProjectFiles(mainPageContent, extraFiles)
    projectStore.setFiles(projectFiles)

    chatStore.addMessageLocal(sessionId, { role: 'assistant', content: result.message })
  } catch (error) {
    ElMessage.error('生成失败: ' + (error as Error).message)
  } finally {
    chatStore.setLoading(false)
    scrollToBottom()
    emit('generated')
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
:deep(.el-empty) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
