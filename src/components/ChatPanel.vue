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
      <template v-if="currentSession?.messages.length || chatStore.isStreaming">
        <template v-for="(message, idx) in currentSession.messages" :key="message.id">
          <div v-if="message.role === 'user'" class="flex gap-3 mb-3 flex-row-reverse">
            <div class="flex-shrink-0">
              <el-avatar :size="32" style="background: #409eff">U</el-avatar>
            </div>
            <div class="max-w-[80%] flex flex-col items-end">
              <div class="px-4 py-3 rounded-xl leading-relaxed break-words bg-blue-500 text-white">
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
            </div>
          </div>

          <template v-else-if="message.role === 'assistant'">
            <div class="mb-3">
              <StageProgress
                v-if="isLastAssistantMessage(idx) && persistedStageProgresses.length > 0"
                :stages="persistedStageProgresses"
                :is-streaming="false"
                :retry-fn="chatStore.isStreaming ? undefined : handleRetryFromStage"
                @stage-click="(stage: StageProgressState) => handleStageClick(stage, message)"
              />
              <StageProgress
                v-else-if="message.stages"
                :stages="messageProgresses(message)"
                :is-streaming="false"
                @stage-click="(stage: StageProgressState) => handleStageClick(stage, message)"
              />
            </div>

            <div class="flex gap-3 mb-5">
              <div class="flex-shrink-0">
                <el-avatar :size="32" style="background: #67c23a">AI</el-avatar>
              </div>
              <div class="max-w-[80%]">
                <div class="px-4 py-3 rounded-xl leading-relaxed break-words bg-gray-100">
                  {{ message.content }}
                </div>
              </div>
            </div>

            <div v-if="isLastAssistantMessage(idx) && !chatStore.isStreaming && chatStore.stageProgresses.length === 0 && message.failedStep != null" class="mb-3 px-11">
              <div class="text-xs text-red-500">
                <template v-for="(stage, key) in message.stages" :key="key">
                  <span v-if="stage?.status === 'error' || stage?.status === 'failed'" class="mr-2">
                    {{ STAGE_NAME_MAP[key as keyof typeof STAGE_NAME_MAP] || key }}: {{ stage?.error }}
                  </span>
                </template>
              </div>
            </div>
          </template>
        </template>

        <template v-if="chatStore.isStreaming">
          <div class="mb-3">
            <StageProgress
              :stages="chatStore.stageProgresses"
              :is-streaming="true"
              :retry-fn="handleRetryFromStage"
              :cancel-fn="chatStore.cancelStreaming"
              @stage-click="handleStageClick"
            />
          </div>
          <div class="px-11 mb-5">
            <div class="px-4 py-3 rounded-xl bg-gray-100 inline-flex items-center">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span class="ml-2 text-gray-500">正在生成...</span>
            </div>
          </div>
        </template>

        <div v-if="isLoading && !chatStore.isStreaming && currentSession?.messages.length === 0 && pendingUserMessage" class="px-11 mb-5">
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
        <div v-if="chatStore.isStreaming || chatStore.stageProgresses.length > 0">
          <StageProgress
            :stages="chatStore.stageProgresses"
            :is-streaming="chatStore.isStreaming"
            :retry-fn="handleRetryFromStage"
            :cancel-fn="chatStore.cancelStreaming"
            @stage-click="handleStageClick"
          />
        </div>
        <div v-else class="px-11">
          <div class="px-4 py-3 rounded-xl bg-gray-100 inline-flex items-center">
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
import { DArrowRight, Loading, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useChatStore } from '@/stores/chat'
import { useProjectStore } from '@/stores/project'
import { generateInitialStream, generateIterateStream, type ApiFile, type Attachment, type SSECallbacks, API_BASE } from '@/api'
import { apiFilesToProjectFiles, filterUserFiles } from '@/utils/files'
import { STAGE_NAME_MAP, INITIAL_STAGE_KEYS } from '@/constants/stages'
import type { ChatMessage, StageProgressState } from '@/types'
import StageProgress from '@/components/StageProgress.vue'

const props = defineProps<{
  historyCollapsed?: boolean
}>()

const emit = defineEmits<{
  'toggle-history': []
}>()

const chatStore = useChatStore()
const projectStore = useProjectStore()

const inputMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const pendingUserMessage = ref('')
const currentAttachments = ref<Attachment[]>([])

const lastAssistantMessageId = computed(() => {
  const msgs = currentSession.value?.messages || []
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'assistant') {
      return { id: msgs[i].id, index: i }
    }
  }
  return null
})

function isLastAssistantMessage(index: number): boolean {
  return lastAssistantMessageId.value?.index === index
}

function stagesToProgressStates(stages: any, stepMessages?: any[] | null): StageProgressState[] {
  const hasInitial = INITIAL_STAGE_KEYS.some(k => stages?.[k])
  const keys = hasInitial ? INITIAL_STAGE_KEYS : ['iteration']
  const generationDone = stages?.generation?.status === 'success' || stages?.generation?.status === 'cached'
  const stepMsgMap = new Map<string, string>()
  if (stepMessages) {
    for (const sm of stepMessages) {
      if (sm.stageName && sm.message) {
        stepMsgMap.set(sm.stageName, sm.message)
      }
    }
  }
  return keys.map((name, index) => {
    const s = stages?.[name]
    if (!s) {
      if (hasInitial && generationDone && index > INITIAL_STAGE_KEYS.indexOf('generation')) {
        return { stage: index, stageName: name, status: 'skipped', duration: null }
      }
      return { stage: index, stageName: name, status: 'pending', duration: null }
    }
    const status: StageProgressState['status'] =
      s.status === 'success' ? 'success' :
      s.status === 'skipped' ? 'skipped' :
      s.status === 'error' || s.status === 'failed' ? 'failed' :
      s.status === 'cancelled' ? 'cancelled' : 'pending'
    return {
      stage: index,
      stageName: name,
      status,
      duration: s.duration ?? null,
      progressMessage: s.error || stepMsgMap.get(name) || undefined,
    }
  })
}

const persistedStageProgresses = computed(() => {
  const msgs = currentSession.value?.messages || []
  const lastAssistant = [...msgs].reverse().find(m => m.role === 'assistant')
  if (!lastAssistant?.stages) return []
  return stagesToProgressStates(lastAssistant.stages, lastAssistant.stepMessages)
})

function messageProgresses(message: { stages?: any; stepMessages?: any[] | null }): StageProgressState[] {
  if (!message.stages) return []
  return stagesToProgressStates(message.stages, message.stepMessages)
}

const currentSession = computed(() => chatStore.currentSession)
const isLoading = computed(() => chatStore.isLoading)

const placeholder = computed(() =>
  currentSession.value
    ? '继续描述您的需求，或提出修改建议...'
    : '输入您的需求，开始生成代码...'
)

function processFilesToProject(files: ApiFile[], componentLib?: string): void {
  const projectFiles = apiFilesToProjectFiles(files, componentLib as any)
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

function buildCallbacks(sessionId: string): SSECallbacks {
  return {
    onStageStart(event) {
      if (!chatStore.currentTaskId) {
        chatStore.currentTaskId = event.taskId
      }
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
        progressMessage: event.message || undefined,
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
      chatStore.currentTaskId = null

      if (event.files) {
        processFilesToProject(event.files, chatStore.currentSession?.componentLib)
        chatStore.updateSessionFiles(sessionId, filterUserFiles(event.files))
      }

      chatStore.addMessageLocal(sessionId, {
        role: 'assistant',
        content: event.message,
        stages: event.stages as any,
        failedStep: event.failedStep,
        stepMessages: event.stepMessages,
      })

      await chatStore.loadSession(sessionId)

      if (event.failedStep != null) {
        ElMessage.warning('生成失败，请点击重试按钮重试')
      } else {
        ElMessage.success('生成成功')
      }

      pendingUserMessage.value = ''
      scrollToBottom()
    },

    onError(event) {
      chatStore.isStreaming = false
      chatStore.currentTaskId = null
      chatStore.setLoading(false)
      pendingUserMessage.value = ''

      chatStore.addMessageLocal(sessionId, {
        role: 'assistant',
        content: event.message,
        stages: event.stages as any,
        failedStep: event.failedStep,
      })

      chatStore.loadSession(sessionId)

      ElMessage.error(`生成失败：${event.message}`)
      scrollToBottom()
    },

    onCancelled(event) {
      chatStore.isStreaming = false
      chatStore.currentTaskId = null
      chatStore.setLoading(false)
      pendingUserMessage.value = ''

      chatStore.addMessageLocal(sessionId, {
        role: 'assistant',
        content: '已取消生成',
        stages: event.stages as any,
        failedStep: event.cancelledAtStep,
      })

      chatStore.loadSession(sessionId)

      ElMessage.info('已取消生成')
      scrollToBottom()
    },
  }
}

async function runGeneration(
  stageNames: string[],
  execute: (callbacks: SSECallbacks) => Promise<void>,
) {
  chatStore.currentTaskId = null
  chatStore.isStreaming = true
  chatStore.setLoading(true)
  chatStore.resetStageProgresses(stageNames)

  const callbacks = buildCallbacks(chatStore.currentSessionId!)

  try {
    await execute(callbacks)
  } catch (error) {
    ElMessage.error('生成失败: ' + (error as Error).message)
    chatStore.isStreaming = false
    chatStore.currentTaskId = null
  } finally {
    chatStore.setLoading(false)
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

    const hasExistingFiles = currentSession.value?.files && currentSession.value.files.length > 0
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
            componentLib: currentSession.value?.componentLib,
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
            files: currentSession.value!.files!,
          },
          callbacks,
        ),
      )
    }
  } catch {
    // errors handled by runGeneration
  }
}

async function handleRetryFromStage(stage: number) {
  const sessionId = chatStore.currentSessionId
  const session = chatStore.currentSession
  if (!sessionId || !session || chatStore.isStreaming) return

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
  )
}

function handleStageClick(stage: StageProgressState, message?: ChatMessage) {
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
