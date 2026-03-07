<template>
  <div class="grid grid-cols-[260px_1fr_1fr] h-[calc(100vh-60px)] bg-gray-100">
    <div class="bg-white overflow-hidden">
      <HistoryPanel @new-chat="handleNewChat" />
    </div>

    <div class="border-l border-r border-gray-200 overflow-hidden">
      <ChatPanel :initial-prompt="initialPrompt" ref="chatPanelRef" />
    </div>

    <div class="overflow-hidden">
      <ResultPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

const initialPrompt = ref('')

onMounted(() => {
  // 从路由参数获取初始prompt
  const prompt = route.query.prompt as string
  if (prompt) {
    initialPrompt.value = prompt
  }
})

function handleNewChat() {
  chatStore.currentSessionId = null
  projectStore.clearProject()
  router.push({ path: '/chat' })
}
</script>
