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
            <div v-if="message.stageOutputs?.length && message.role === 'assistant'" class="mt-2">
              <div class="stage-summary">
                <el-tag
                  v-for="output in message.stageOutputs"
                  :key="output.stage"
                  :type="output.status === 'success' || output.status === 'cached' ? 'success' : output.status === 'failed' ? 'danger' : 'info'"
                  size="small"
                  class="stage-tag"
                  @click="handleViewStageOutput(message, output)"
                >
                  {{ stageNameMap[output.stageName] || output.stageName }}
                  ({{ output.duration != null ? output.duration.toFixed(1) + 's' : '--' }})
                </el-tag>
              </div>
            </div>
            <div v-if="message.failedStep != null && lastAssistantMessageId === message.id && !message.stageOutputs?.length" class="mt-2">
              <el-button type="warning" size="small" :loading="isRetrying && retryingMessageId === message.id" @click="handleRetry(message)">
                <el-icon class="mr-1"><RefreshRight /></el-icon>
                重试
              </el-button>
              <div v-if="message.stages" class="mt-1 text-xs text-red-500">
                <template v-for="(stage, key) in message.stages" :key="key">
                  <span v-if="stage?.status === 'error' || stage?.status === 'failed'" class="mr-2">
                    {{ stageNameMap[key as keyof typeof stageNameMap] || key }}: {{ stage?.error }}
                  </span>
                </template>
              </div>
            </div>
            <div class="text-xs text-gray-400 mt-1">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>

        <div v-if="chatStore.isStreaming || chatStore.stageProgresses.length > 0" class="mb-5">
          <StageProgress
            :stages="chatStore.stageProgresses"
            :is-streaming="chatStore.isStreaming"
            :on-retry="handleRetryFromStage"
            :on-cancel="chatStore.cancelStreaming"
            @stage-click="handleStageClick"
          />
        </div>

        <div v-else-if="isLoading && !chatStore.isStreaming" class="flex gap-3 mb-5">
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
        <div v-if="chatStore.isStreaming || chatStore.stageProgresses.length > 0">
          <StageProgress
            :stages="chatStore.stageProgresses"
            :is-streaming="chatStore.isStreaming"
            :on-retry="handleRetryFromStage"
            :on-cancel="chatStore.cancelStreaming"
            @stage-click="handleStageClick"
          />
        </div>
        <div v-else class="flex gap-3">
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
        <el-button type="primary" :loading="isLoading" :disabled="!inputMessage.trim() || chatStore.isStreaming" @click="sendMessage">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { DArrowRight, Loading, Document, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chat'
import { useProjectStore } from '@/stores/project'
import { generateInitialStream, generateIterateStream, type ApiFile, type Attachment, type SSECallbacks, API_BASE } from '@/api'
import { buildProjectFiles } from '@/templates/project-template'
import type { ProjectFile, ChatMessage, StageOutput, StageProgressState } from '@/types'
import StageProgress from '@/components/StageProgress.vue'

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
  iteration: '迭代修改',
}
const currentSession = computed(() => chatStore.currentSession)
const isLoading = computed(() => chatStore.isLoading)

const placeholder = computed(() =>
  currentSession.value
    ? '继续描述您的需求，或提出修改建议...'
    : '输入您的需求，开始生成代码...'
)

const SYSTEM_FILE_PATHS = new Set([
  '/src/main.ts',
  '/src/App.vue',
  '/src/style.css',
  '/public/index.html',
  '/package.json',
  '/vite.config.ts',
])

function filterSystemFiles(files: ApiFile[]): ApiFile[] {
  return files.filter(f => !SYSTEM_FILE_PATHS.has(f.path))
}

function processFilesToProject(files: ApiFile[], componentLib?: string): void {
  const userFiles = filterSystemFiles(files)
  const mainPageContent = userFiles[0]?.content || ''
  const extraFiles: ProjectFile[] = userFiles.slice(1).map((f) => ({
    id: f.id,
    name: f.name,
    path: f.path,
    type: f.type as 'file',
    language: f.language as ProjectFile['language'],
    content: f.content,
  }))
  const projectFiles = buildProjectFiles(mainPageContent, extraFiles, componentLib as any)
  projectStore.setFiles(projectFiles)
}

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

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function buildCallbacks(
  sessionId: string,
  _isNewSession: boolean,
): SSECallbacks {
  return {
    onStageStart(event) {
      chatStore.updateStageStatus(event.stage, 'running', {
        progressMessage: '',
      })
    },

    onStageProgress(event) {
      chatStore.updateStageStatus(event.stage, 'running', {
        progressMessage: event.message,
      })
    },

    onStageComplete(event) {
      chatStore.updateStageStatus(event.stage, event.status, {
        duration: event.duration,
      })

      if (event.outputType === 'markdown' && event.outputPreview) {
        chatStore.setStagePreview(event.stageName, 'markdown', event.outputPreview, null, event.filePath)
        chatStore.setActiveStageTab(event.stageName)
      }

      if (event.outputType === 'vue' && event.files) {
        processFilesToProject(event.files, chatStore.currentSession?.componentLib)
        chatStore.setStagePreview(event.stageName, 'vue', null, event.files, event.vueDirPath)
        nextTick(() => {
          chatStore.setActiveStageTab(event.stageName)
        })
      }

      scrollToBottom()
    },

    async onDone(event) {
      chatStore.isStreaming = false
      chatStore.abortController = null

      if (event.files) {
        processFilesToProject(event.files, chatStore.currentSession?.componentLib)
        chatStore.updateSessionFiles(sessionId, filterSystemFiles(event.files))
      }

      chatStore.addMessageLocal(sessionId, {
        role: 'assistant',
        content: event.message,
        stages: event.stages as any,
        failedStep: event.failedStep,
      })

      await chatStore.loadSession(sessionId)

      if (event.failedStep != null) {
        ElMessage.warning('生成失败，请点击重试按钮重试')
      } else {
        ElMessage.success('生成成功')
      }

      pendingUserMessage.value = ''
      scrollToBottom()
      emit('generated')
    },

    onError(event) {
      chatStore.isStreaming = false
      chatStore.abortController = null
      chatStore.setLoading(false)
      pendingUserMessage.value = ''
      ElMessage.error(`生成失败：${event.message}`)
      scrollToBottom()
      emit('generated')
    },
  }
}

async function sendMessage() {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value || chatStore.isStreaming) return

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
    const isNewSession = !hasExistingFiles

    const controller = new AbortController()
    chatStore.abortController = controller
    chatStore.isStreaming = true

    const stageNames = isNewSession
      ? ['attachment', 'requirement', 'generation', 'optimization']
      : ['iteration']
    chatStore.resetStageProgresses(stageNames)

    const callbacks = buildCallbacks(sessionId!, isNewSession)

    if (isNewSession) {
      await generateInitialStream(
        {
          prompt: message,
          sessionId,
          debug: false,
          componentLib: currentSession.value?.componentLib,
          attachments: attachmentsToSend,
        },
        callbacks,
        controller.signal,
      )
    } else {
      await generateIterateStream(
        {
          prompt: message,
          sessionId,
          files: currentSession.value!.files!,
        },
        callbacks,
        controller.signal,
      )
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      ElMessage.info('已取消生成')
    } else {
      ElMessage.error('生成失败: ' + (error as Error).message)
    }
    chatStore.isStreaming = false
    chatStore.abortController = null
  } finally {
    chatStore.setLoading(false)
    pendingUserMessage.value = ''
    scrollToBottom()
    emit('generated')
  }
}

async function handleRetryFromStage(stage: number) {
  const sessionId = chatStore.currentSessionId
  const session = chatStore.currentSession
  if (!sessionId || !session) return

  const firstUserMessage = session.messages.find(m => m.role === 'user')
  if (!firstUserMessage) return

  const controller = new AbortController()
  chatStore.abortController = controller
  chatStore.isStreaming = true
  chatStore.setLoading(true)

  const stageNames = ['attachment', 'requirement', 'generation', 'optimization']
  chatStore.resetStageProgresses(stageNames)

  const callbacks = buildCallbacks(sessionId, true)

  try {
    await generateInitialStream(
      {
        prompt: firstUserMessage.content,
        sessionId,
        componentLib: session.componentLib,
        fromStep: stage,
      },
      callbacks,
      controller.signal,
    )
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      ElMessage.info('已取消生成')
    } else {
      ElMessage.error('重试失败: ' + (error as Error).message)
    }
    chatStore.isStreaming = false
    chatStore.abortController = null
    chatStore.setLoading(false)
  }
}

async function handleRetry(message: ChatMessage) {
  if (!currentSession.value || message.failedStep == null || isRetrying.value || chatStore.isStreaming) return

  const sessionId = chatStore.currentSessionId!
  const firstUserMessage = currentSession.value.messages.find(m => m.role === 'user')
  if (!firstUserMessage) return

  const controller = new AbortController()
  chatStore.abortController = controller
  isRetrying.value = true
  retryingMessageId.value = message.id
  chatStore.setLoading(true)
  chatStore.isStreaming = true

  const stageNames = ['attachment', 'requirement', 'generation', 'optimization']
  chatStore.resetStageProgresses(stageNames)

  const callbacks = buildCallbacks(sessionId, true)

  try {
    await generateInitialStream(
      {
        prompt: firstUserMessage.content,
        sessionId,
        componentLib: currentSession.value.componentLib,
        fromStep: message.failedStep,
      },
      callbacks,
      controller.signal,
    )
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      ElMessage.info('已取消生成')
    } else {
      ElMessage.error('重试失败: ' + (error as Error).message)
    }
    chatStore.isStreaming = false
    chatStore.abortController = null
  } finally {
    isRetrying.value = false
    retryingMessageId.value = null
    chatStore.setLoading(false)
    scrollToBottom()
    emit('generated')
  }
}

function handleStageClick(stage: StageProgressState) {
  chatStore.setActiveStageTab(stage.stageName)
}

async function handleViewStageOutput(
  assistantMsg: ChatMessage,
  output: StageOutput,
) {
  const session = currentSession.value
  if (!session) {
    chatStore.setActiveStageTab(output.stageName)
    return
  }

  const allOutputs = session.messages.flatMap(m => m.stageOutputs || [])
  const sameNameOutputs = allOutputs.filter(o => o.stageName === output.stageName)

  let key: string
  if (sameNameOutputs.length > 1) {
    const idx = sameNameOutputs.indexOf(output)
    key = `${output.stageName}_${idx + 1}`
  } else {
    key = output.stageName
  }

  chatStore.setActiveStageTab(key)
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

.stage-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.stage-tag {
  cursor: pointer;
  transition: opacity 0.2s;
}

.stage-tag:hover {
  opacity: 0.8;
}
</style>
