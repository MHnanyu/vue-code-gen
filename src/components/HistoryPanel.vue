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
                class="edit-input"
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

      <el-empty v-if="sortedSessions.length === 0" description="暂无历史记录" :image-size="60" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { ElMessageBox } from 'element-plus'
import { Plus, ChatDotRound, Delete, DArrowLeft } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import type { ChatSession } from '@/types'

const emit = defineEmits<{
  newChat: []
  toggle: []
}>()

const chatStore = useChatStore()

const sortedSessions = computed(() => chatStore.sortedSessions)
const currentSessionId = computed(() => chatStore.currentSessionId)

const editingSessionId = ref<string | null>(null)
const editTitle = ref('')
const originalTitle = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function setInputRef(el: HTMLInputElement | null) {
  if (el) {
    inputRef.value = el
  }
}

const SYSTEM_FILE_PATHS = new Set([
  '/src/main.ts',
  '/src/App.vue',
  '/src/style.css',
  '/public/index.html',
  '/package.json',
  '/vite.config.ts',
])

function filterUserFiles(files: any[]) {
  return files.filter(f => !SYSTEM_FILE_PATHS.has(f.path))
}

async function selectSession(id: string) {
  if (editingSessionId.value === id) return
  if (chatStore.currentSessionId === id) return
  
  await chatStore.loadSession(id)
  chatStore.selectSession(id)
  
  const session = chatStore.sessions.find(s => s.id === id)
  if (session && session.files && session.files.length > 0) {
    const projectStore = await import('@/stores/project').then(m => m.useProjectStore())
    const { buildProjectFiles } = await import('@/templates/project-template')
    const userFiles = filterUserFiles(session.files)
    const mainPageContent = userFiles[0]?.content || ''
    const extraFiles = userFiles.slice(1).map((f: any) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      type: f.type as 'file',
      language: f.language,
      content: f.content,
    }))
    const projectFiles = buildProjectFiles(mainPageContent, extraFiles)
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
:deep(.el-empty) {
  padding: 40px 0;
}

.edit-input {
  width: 100%;
  max-width: 160px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid #409eff;
  border-radius: 4px;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  line-height: 22px;
  background: #fff;
}
</style>
