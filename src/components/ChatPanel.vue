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
              <div v-if="message.attachments?.length" class="flex flex-wrap gap-2 mb-2 items-center">
                <template v-for="att in message.attachments" :key="att.id">
                  <el-popover v-if="att.type === 'image'" placement="top" :width="300" trigger="hover">
                    <template #reference>
                      <img :src="`${API_BASE}${att.url}`" class="w-16 h-16 rounded-lg object-cover cursor-pointer border-2 border-white/30 shrink-0" />
                    </template>
                    <img :src="`${API_BASE}${att.url}`" class="w-full rounded" />
                  </el-popover>
                  <el-tooltip v-else :content="att.name" placement="top" :show-after="300">
                    <div class="flex items-center gap-1 w-16 h-16 rounded-lg bg-blue-400 text-white text-xs shrink-0 flex-col justify-center cursor-default">
                      <el-icon :size="20"><Document /></el-icon>
                      <span class="w-full text-center truncate px-1">{{ att.name }}</span>
                    </div>
                  </el-tooltip>
                </template>
              </div>
              {{ message.content }}
            </div>
            <div v-if="message.failedStep != null && lastAssistantMessageId === message.id" class="mt-2">
              <el-button type="warning" size="small" :loading="isRetrying && retryingMessageId === message.id" @click="handleRetry(message)">
                <el-icon class="mr-1"><RefreshRight /></el-icon>
                重试
              </el-button>
              <div v-if="message.stages" class="mt-1 text-xs text-red-500">
                <template v-for="(stage, key) in message.stages" :key="key">
                  <span v-if="stage.status === 'error' || stage.status === 'failed'" class="mr-2">
                    {{ stageNameMap[key as keyof typeof stageNameMap] || key }}: {{ stage.error }}
                  </span>
                </template>
              </div>
            </div>
            <div class="text-xs text-gray-400 mt-1">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        <div v-if="isLoading" class="flex gap-3 mb-5">
          <div class="flex-shrink-0">
            <el-avatar :size="32" style="background: #67c23a">AI</el-avatar>
          </div>
          <div class="px-4 py-3 rounded-xl bg-gray-100">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span class="ml-2 text-gray-500">正在生成...</span>
          </div>
        </div>
      </template>
      <div v-else-if="isLoading && pendingUserMessage" class="flex flex-col gap-5">
        <div class="flex gap-3 flex-row-reverse">
          <div class="flex-shrink-0">
            <el-avatar :size="32" style="background: #409eff">U</el-avatar>
          </div>
          <div class="px-4 py-3 rounded-xl bg-blue-500 text-white">{{ pendingUserMessage }}</div>
        </div>
        <div class="flex gap-3">
          <div class="flex-shrink-0">
            <el-avatar :size="32" style="background: #67c23a">AI</el-avatar>
          </div>
          <div class="px-4 py-3 rounded-xl bg-gray-100">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span class="ml-2 text-gray-500">正在生成...</span>
          </div>
        </div>
      </div>
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
import { DArrowRight, Loading, Document, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chat'
import { useProjectStore } from '@/stores/project'
import { generateInitial, generateIterate, type ApiFile, type Attachment, API_BASE } from '@/api'
import { buildProjectFiles } from '@/templates/project-template'
import type { ProjectFile, ChatMessage } from '@/types'

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
const pendingUserMessage = ref('')
const currentAttachments = ref<Attachment[]>([])
const isRetrying = ref(false)
const retryingMessageId = ref<string | null>(null)

const lastAssistantMessageId = computed(() => {
  const msgs = currentSession.value?.messages || []
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'assistant') {
      return msgs[i].id
    }
  }
  return null
})

const stageNameMap: Record<string, string> = {
  attachment: '附件处理',
  requirement: '需求标准化',
  generation: '代码生成',
  optimization: 'UX优化',
}
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
    
    if (chatStore.pendingAttachments.length > 0) {
      currentAttachments.value = [...chatStore.pendingAttachments]
      chatStore.clearPendingAttachments()
    }
    
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
    if (!sessionId) {
      return
    }
  }

  const attachmentsToSend = currentAttachments.value.length > 0 ? [...currentAttachments.value] : undefined
  currentAttachments.value = []
  
  pendingUserMessage.value = message
  scrollToBottom()
  chatStore.setLoading(true)

  try {
    await chatStore.addMessageRemote(sessionId, { 
      role: 'user', 
      content: message, 
      attachments: attachmentsToSend 
    })
    
    const hasExistingFiles = currentSession.value?.files && currentSession.value.files.length > 0
    
    let result
    if (hasExistingFiles) {
      result = await generateIterate({
        prompt: message,
        sessionId,
        files: currentSession.value!.files!,
      })
    } else {
      result = await generateInitial({
        prompt: message,
        sessionId,
        debug: false,
        componentLib: currentSession.value?.componentLib,
        attachments: attachmentsToSend,
      })
    }

    const SYSTEM_FILE_PATHS = new Set([
      '/src/main.ts',
      '/src/App.vue',
      '/src/style.css',
      '/public/index.html',
      '/package.json',
      '/vite.config.ts',
    ])

    const userFiles = result.files?.filter(f => !SYSTEM_FILE_PATHS.has(f.path)) || []

    const mainPageContent = userFiles[0]?.content || ''
    const extraFiles: ProjectFile[] = userFiles.slice(1).map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      type: f.type as 'file',
      language: f.language as ProjectFile['language'],
      content: f.content,
    }))
    const projectFiles = buildProjectFiles(mainPageContent, extraFiles, currentSession.value?.componentLib)
    projectStore.setFiles(projectFiles)
    chatStore.updateSessionFiles(sessionId!, userFiles)
    
    await chatStore.loadSession(sessionId!)

    if ('failedStep' in result && result.failedStep != null) {
      ElMessage.warning('生成失败，请点击重试按钮重试')
    } else {
      ElMessage.success('生成成功')
    }
  } catch (error) {
    ElMessage.error('生成失败: ' + (error as Error).message)
  } finally {
    chatStore.setLoading(false)
    pendingUserMessage.value = ''
    scrollToBottom()
    emit('generated')
  }
}

async function handleRetry(message: ChatMessage) {
  if (!currentSession.value || message.failedStep == null || isRetrying.value) return

  const sessionId = chatStore.currentSessionId!
  const firstUserMessage = currentSession.value.messages.find(m => m.role === 'user')
  if (!firstUserMessage) return

  isRetrying.value = true
  retryingMessageId.value = message.id
  chatStore.setLoading(true)

  try {
    const result = await generateInitial({
      prompt: firstUserMessage.content,
      sessionId,
      componentLib: currentSession.value.componentLib,
      fromStep: message.failedStep,
    })

    const SYSTEM_FILE_PATHS = new Set([
      '/src/main.ts',
      '/src/App.vue',
      '/src/style.css',
      '/public/index.html',
      '/package.json',
      '/vite.config.ts',
    ])

    const userFiles = result.files?.filter(f => !SYSTEM_FILE_PATHS.has(f.path)) || []

    const mainPageContent = userFiles[0]?.content || ''
    const extraFiles: ProjectFile[] = userFiles.slice(1).map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      type: f.type as 'file',
      language: f.language as ProjectFile['language'],
      content: f.content,
    }))
    const projectFiles = buildProjectFiles(mainPageContent, extraFiles, currentSession.value?.componentLib)
    projectStore.setFiles(projectFiles)
    chatStore.updateSessionFiles(sessionId, userFiles)

    await chatStore.loadSession(sessionId)

    if (result.failedStep != null) {
      ElMessage.warning('重试仍然失败，请再次点击重试')
    } else {
      ElMessage.success('重试成功')
    }
  } catch (error) {
    ElMessage.error('重试失败: ' + (error as Error).message)
  } finally {
    isRetrying.value = false
    retryingMessageId.value = null
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
