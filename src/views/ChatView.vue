<template>
  <div
    class="flex h-[calc(100vh-60px)] bg-gray-100 p-3 gap-3"
    :class="isResizing ? 'select-none' : ''"
  >
    <div
      class="bg-white rounded-lg overflow-hidden shadow-sm transition-all duration-300 flex-shrink-0"
      :style="{ width: isHistoryCollapsed ? '0px' : '260px', padding: isHistoryCollapsed ? '0' : '', opacity: isHistoryCollapsed ? '0' : '1' }"
    >
      <HistoryPanel @new-chat="handleNewChat" @toggle="toggleHistory" :collapsed="isHistoryCollapsed" />
    </div>

    <div class="flex-1 bg-white rounded-lg shadow-sm flex min-w-0">
      <div
        class="overflow-hidden flex-shrink-0"
        :style="{ width: chatPanelWidth + 'px' }"
      >
        <ChatPanel
          ref="chatPanelRef"
          :history-collapsed="isHistoryCollapsed"
          @toggle-history="toggleHistory"
        />
      </div>

      <div
        class="w-px cursor-col-resize transition-colors relative self-stretch my-4 group"
        :class="isResizing ? 'bg-blue-400' : 'bg-gray-200 hover:bg-blue-300'"
        @mousedown="startResize"
      >
        <div class="absolute inset-y-0 -left-3 -right-3 cursor-col-resize" />
      </div>

      <div class="flex-1 overflow-hidden min-w-[200px] relative">
        <ResultPanel />
        <div
          v-if="isResizing"
          class="absolute inset-0 z-50"
          style="cursor: col-resize"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useProjectStore } from '@/stores/project'
import HistoryPanel from '@/components/HistoryPanel.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import ResultPanel from '@/components/ResultPanel.vue'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const projectStore = useProjectStore()

const chatPanelRef = ref<InstanceType<typeof ChatPanel> | null>(null)

const isHistoryCollapsed = ref(false)
const chatPanelWidth = ref(450)
const isResizing = ref(false)
let startX = 0
let startWidth = 0

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

onMounted(async () => {
  await chatStore.loadSessions()

  const sessionId = route.query.session_id as string
  if (sessionId) {
    await chatStore.loadSession(sessionId)
    chatStore.selectSession(sessionId)
    
    const session = chatStore.sessions.find(s => s.id === sessionId)
    if (session && session.files && session.files.length > 0) {
      const { buildProjectFiles } = await import('@/templates/project-template')
      const userFiles = filterUserFiles(session.files)
      const mainPageContent = userFiles[0]?.content || ''
      const extraFiles = userFiles.slice(1).map((f) => ({
        id: f.id,
        name: f.name,
        path: f.path,
        type: f.type as 'file',
        language: f.language as any,
        content: f.content,
      }))
      const projectFiles = buildProjectFiles(mainPageContent, extraFiles)
      projectStore.setFiles(projectFiles)
    } else {
      projectStore.clearProject()
    }
  } else {
    projectStore.clearProject()
  }
})

watch(() => chatStore.currentSessionId, async (id) => {
  if (!id) {
    projectStore.clearProject()
    return
  }
  
  if (route.query.session_id !== id) {
    router.replace({ path: '/chat', query: { session_id: id } })
  }
  
  const session = chatStore.sessions.find(s => s.id === id)
  if (!session) {
    projectStore.clearProject()
    return
  }
  
  if (session.files && session.files.length > 0) {
    const { buildProjectFiles } = await import('@/templates/project-template')
    const userFiles = filterUserFiles(session.files)
    const mainPageContent = userFiles[0]?.content || ''
    const extraFiles = userFiles.slice(1).map((f) => ({
      id: f.id,
      name: f.name,
      path: f.path,
      type: f.type as 'file',
      language: f.language as any,
      content: f.content,
    }))
    const projectFiles = buildProjectFiles(mainPageContent, extraFiles)
    projectStore.setFiles(projectFiles)
  } else {
    projectStore.clearProject()
  }
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

function handleNewChat() {
  chatStore.currentSessionId = null
  projectStore.clearProject()
  router.push({ path: '/chat' })
}

function toggleHistory() {
  isHistoryCollapsed.value = !isHistoryCollapsed.value
}

function startResize(e: MouseEvent) {
  e.preventDefault()
  isResizing.value = true
  startX = e.clientX
  startWidth = chatPanelWidth.value
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleMouseMove(e: MouseEvent) {
  if (!isResizing.value) return
  const diff = e.clientX - startX
  const newWidth = startWidth + diff
  chatPanelWidth.value = Math.max(300, Math.min(newWidth, 800))
}

function handleMouseUp() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}
</script>
