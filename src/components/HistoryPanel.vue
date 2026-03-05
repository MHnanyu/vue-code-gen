<template>
  <div class="history-panel">
    <div class="panel-header">
      <h3>历史记录</h3>
      <el-button text type="primary" size="small" @click="handleNewChat">
        <el-icon><Plus /></el-icon>
        新对话
      </el-button>
    </div>

    <div class="history-list">
      <div
        v-for="session in sortedSessions"
        :key="session.id"
        class="history-item"
        :class="{ active: session.id === currentSessionId }"
        @click="selectSession(session.id)"
      >
        <div class="item-content">
          <el-icon class="item-icon"><ChatDotRound /></el-icon>
          <div class="item-info">
            <div class="item-title">{{ session.title }}</div>
            <div class="item-time">{{ formatTime(session.updatedAt) }}</div>
          </div>
        </div>
        <el-button
          text
          class="delete-btn"
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
.history-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e4e7ed;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.history-item:hover {
  background: #f5f7fa;
}

.history-item.active {
  background: #ecf5ff;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.item-icon {
  color: #909399;
  font-size: 18px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

:deep(.el-empty) {
  padding: 40px 0;
}
</style>
