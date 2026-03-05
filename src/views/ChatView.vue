<template>
  <div class="chat-view">
    <!-- 左侧：历史记录 -->
    <div class="left-panel">
      <HistoryPanel @new-chat="handleNewChat" />
    </div>

    <!-- 中间：对话区域 -->
    <div class="middle-panel">
      <ChatPanel :initial-prompt="initialPrompt" ref="chatPanelRef" />
    </div>

    <!-- 右侧：生成结果 -->
    <div class="right-panel">
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
  // 清空当前会话，开始新对话
  chatStore.currentSessionId = null
  projectStore.clearProject()
  router.push({ path: '/chat' })
}
</script>

<style scoped>
.chat-view {
  display: grid;
  grid-template-columns: 260px 1fr 1fr;
  gap: 0;
  height: calc(100vh - 60px);
  background: #f0f2f5;
}

.left-panel {
  background: #fff;
  overflow: hidden;
}

.middle-panel {
  border-left: 1px solid #e4e7ed;
  border-right: 1px solid #e4e7ed;
  overflow: hidden;
}

.right-panel {
  overflow: hidden;
}
</style>
