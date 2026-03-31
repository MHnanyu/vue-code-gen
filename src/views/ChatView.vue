<template>
  <div
    v-if="isReady"
    class="flex h-[calc(100vh-60px)] bg-gray-100 p-3 gap-3"
    :class="isResizing ? 'select-none' : ''"
  >
    <div
      class="bg-white rounded-lg overflow-hidden shadow-sm transition-all duration-300 flex-shrink-0"
      :style="historyPanelStyle"
    >
      <HistoryPanel @new-chat="handleNewChat" @toggle="toggleHistory" :collapsed="isHistoryCollapsed" />
    </div>

    <div class="flex-1 bg-white rounded-lg shadow-sm flex min-w-0">
      <div
        class="overflow-hidden flex-shrink-0"
        :style="{ width: chatPanelWidth + 'px' }"
      >
        <ChatPanel
          :history-collapsed="isHistoryCollapsed"
          @toggle-history="toggleHistory"
        />
      </div>

      <div
        class="w-px cursor-col-resize transition-colors relative self-stretch group"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useProjectStore } from '@/stores/project'
import { apiFilesToProjectFiles } from '@/utils/files'
import HistoryPanel from '@/components/HistoryPanel.vue'
import ChatPanel from '@/components/ChatPanel.vue'
import ResultPanel from '@/components/ResultPanel.vue'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const projectStore = useProjectStore()

const isHistoryCollapsed = ref(false)
const chatPanelWidth = ref(450)
const isResizing = ref(false)
const isReady = ref(false)

const historyPanelStyle = computed(() =>
  isHistoryCollapsed.value
    ? { width: '0px', padding: '0', opacity: '0' }
    : { width: '260px', padding: '', opacity: '1' },
)
let startX = 0
let startWidth = 0

function loadSessionProjectFiles(session: { files?: any[]; componentLib?: any }) {
  if (session.files && session.files.length > 0) {
    const projectFiles = apiFilesToProjectFiles(session.files, session.componentLib)
    projectStore.setFiles(projectFiles)
  } else {
    projectStore.clearProject()
  }
}

onMounted(async () => {
  await chatStore.loadSessions()

  const sessionId = route.query.session_id as string
  if (sessionId) {
    chatStore.selectSession(sessionId)
    await chatStore.loadSession(sessionId)
    
    const session = chatStore.sessions.find(s => s.id === sessionId)
    if (session) {
      loadSessionProjectFiles(session)
    } else {
      projectStore.clearProject()
    }
  } else if (chatStore.currentSessionId) {
    router.replace({ path: '/workspace', query: { session_id: chatStore.currentSessionId } })
  } else {
    projectStore.clearProject()
  }
  
  isReady.value = true
})

watch(() => route.query.session_id, (sessionId) => {
  if (!sessionId && chatStore.currentSessionId) {
    router.replace({ path: '/workspace', query: { session_id: chatStore.currentSessionId } })
  }
})

watch(() => chatStore.currentSessionId, async (id) => {
  if (!id) {
    projectStore.clearProject()
    return
  }
  
  if (route.query.session_id !== id) {
    router.replace({ path: '/workspace', query: { session_id: id } })
  }
  
  const session = chatStore.sessions.find(s => s.id === id)
  if (!session) {
    projectStore.clearProject()
    return
  }
  
  loadSessionProjectFiles(session)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
})

function handleNewChat() {
  chatStore.currentSessionId = null
  projectStore.clearProject()
  router.push({ path: '/workspace' })
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
