<template>
  <div class="h-full flex flex-col">
    <div class="flex justify-between items-center px-4 py-4 border-b border-gray-200">
      <h3 class="m-0 text-base text-gray-800">历史记录</h3>
      <div class="flex items-center gap-1">
        <el-button text type="primary" size="small" @click="handleNewChat">
          <el-icon><Plus /></el-icon>
          新对话
        </el-button>
        <el-button text size="small" @click="$emit('toggle')" title="收起侧边栏">
          <el-icon><DArrowLeft /></el-icon>
        </el-button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-2">
      <div
        v-for="session in sortedSessions"
        :key="session.id"
        class="group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all mb-1 hover:bg-gray-50"
        :class="session.id === currentSessionId ? 'bg-blue-50' : ''"
        @click="selectSession(session.id)"
        @dblclick="startEdit(session)"
      >
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <el-icon class="text-gray-400 text-lg"><ChatDotRound /></el-icon>
          <div class="flex-1 min-w-0">
            <template v-if="editingSessionId === session.id">
              <input
                :ref="el => setInputRef(el as HTMLInputElement)"
                v-model="editTitle"
                class="w-full max-w-[160px] h-6 px-1.5 border border-blue-500 rounded outline-none text-sm leading-[22px] bg-white"
                @click.stop
                @blur="handleBlur"
                @keydown.enter="handleEnter"
                @keydown.escape="cancelEdit"
              />
            </template>
            <template v-else>
              <div class="text-sm text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
                {{ session.title }}
              </div>
            </template>
            <div class="text-xs text-gray-400 mt-1">{{ formatTime(session.updatedAt) }}</div>
            <div v-if="lastAssistantStageSummary(session).length" class="stage-tags mt-1">
              <el-tag
                v-for="item in lastAssistantStageSummary(session)"
                :key="item.name"
                size="small"
                :type="item.status === 'success' || item.status === 'cached' ? 'success' : item.status === 'failed' ? 'danger' : item.status === 'skipped' ? 'warning' : 'info'"
              >
                {{ STAGE_NAME_MAP[item.name] || item.name }}
              </el-tag>
            </div>
          </div>
        </div>
        <el-button
          v-if="editingSessionId !== session.id"
          text
          class="opacity-0 transition-opacity group-hover:opacity-100"
          @click.stop="handleDelete(session.id)"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>

      <el-empty v-if="sortedSessions.length === 0" description="暂无历史记录" :image-size="60" class="empty-box" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Plus, ChatDotRound, Delete, DArrowLeft } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { apiFilesToProjectFiles, filterUserFiles } from '@/utils/files'
import { STAGE_NAME_MAP, INITIAL_STAGE_KEYS } from '@/constants/stages'
import type { ChatSession } from '@/types'

const emit = defineEmits<{
  newChat: []
  toggle: []
}>()

const chatStore = useChatStore()

const sortedSessions = computed(() => chatStore.sortedSessions)
const currentSessionId = computed(() => chatStore.currentSessionId)

function lastAssistantStageSummary(session: ChatSession) {
  const lastAssistant = [...(session.messages || [])]
    .reverse()
    .find(m => m.role === 'assistant')
  if (!lastAssistant) return []

  const stages = lastAssistant.stages
  const stepMessages = lastAssistant.stepMessages || []

  const INITIAL_KEYS = INITIAL_STAGE_KEYS
  const hasInitial = INITIAL_KEYS.some(k => stages?.[k])
  const keys = hasInitial ? INITIAL_KEYS : ['iteration']

  const result: { name: string; status: string }[] = []
  for (const name of keys) {
    const s = stages?.[name]
    if (!s) {
      if (hasInitial && stages?.generation?.status === 'success' && name === 'optimization') {
        result.push({ name, status: 'skipped' })
      }
      continue
    }
    result.push({ name, status: s.status })
  }

  if (result.length === 0) {
    for (const sm of stepMessages) {
      result.push({ name: sm.stageName, status: sm.status })
    }
  }

  return result
}

const editingSessionId = ref<string | null>(null)
const editTitle = ref('')
const originalTitle = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function setInputRef(el: HTMLInputElement | null) {
  if (el) {
    inputRef.value = el
  }
}

async function selectSession(id: string) {
  if (editingSessionId.value === id) return
  if (chatStore.currentSessionId === id) return
  
  await chatStore.loadSession(id)
  chatStore.selectSession(id)
  
  const session = chatStore.sessions.find(s => s.id === id)
  if (session && session.files && session.files.length > 0) {
    const projectStore = await import('@/stores/project').then(m => m.useProjectStore())
    const projectFiles = apiFilesToProjectFiles(session.files, session.componentLib)
    projectStore.setFiles(projectFiles)
  } else {
    const projectStore = await import('@/stores/project').then(m => m.useProjectStore())
    projectStore.clearProject()
  }
}

function startEdit(session: ChatSession) {
  if (chatStore.currentSessionId !== session.id) {
    selectSession(session.id)
    return
  }
  editingSessionId.value = session.id
  editTitle.value = session.title
  originalTitle.value = session.title
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

async function handleRenameSubmit() {
  if (!editingSessionId.value) return
  
  const newTitle = editTitle.value.trim()
  
  if (!newTitle || newTitle === originalTitle.value) {
    editingSessionId.value = null
    return
  }
  
  await chatStore.updateSessionTitleRemote(editingSessionId.value, newTitle)
  editingSessionId.value = null
}

function handleBlur() {
  handleRenameSubmit()
}

function handleEnter() {
  inputRef.value?.blur()
}

function cancelEdit() {
  editingSessionId.value = null
  editTitle.value = ''
}

async function handleDelete(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除该会话吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    chatStore.deleteSessionRemote(id)
  } catch {
    // 用户取消
  }
}

function handleNewChat() {
  emit('newChat')
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.empty-box :deep(.el-empty) {
  padding: 40px 0;
}
</style>
