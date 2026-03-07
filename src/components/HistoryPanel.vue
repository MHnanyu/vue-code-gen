<template>
  <div class="h-full flex flex-col bg-white border-r border-gray-200">
    <div class="flex justify-between items-center px-4 py-4 border-b border-gray-200">
      <h3 class="m-0 text-base text-gray-800">历史记录</h3>
      <el-button text type="primary" size="small" @click="handleNewChat">
        <el-icon><Plus /></el-icon>
        新对话
      </el-button>
    </div>

    <div class="flex-1 overflow-y-auto p-2">
      <div
        v-for="session in sortedSessions"
        :key="session.id"
        class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all mb-1 hover:bg-gray-50"
        :class="session.id === currentSessionId ? 'bg-blue-50' : ''"
        @click="selectSession(session.id)"
      >
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <el-icon class="text-gray-400 text-lg"><ChatDotRound /></el-icon>
          <div class="flex-1 min-w-0">
            <div class="text-sm text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ session.title }}
            </div>
            <div class="text-xs text-gray-400 mt-1">{{ formatTime(session.updatedAt) }}</div>
          </div>
        </div>
        <el-button
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
import { computed } from 'vue'
import { Plus, ChatDotRound, Delete } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'

const emit = defineEmits<{
  newChat: []
}>()

const chatStore = useChatStore()

const sortedSessions = computed(() => chatStore.sortedSessions)
const currentSessionId = computed(() => chatStore.currentSessionId)

function selectSession(id: string) {
  chatStore.selectSession(id)
}

function handleDelete(id: string) {
  chatStore.deleteSession(id)
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
</style>
