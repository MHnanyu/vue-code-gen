<template>
  <div class="stage-toggle" :class="{ 'has-failure': hasFailure, 'has-cancelled': hasCancelled }" @click="$emit('toggle')">
    <el-icon class="toggle-arrow" :class="{ expanded: !collapsed }"><ArrowRight /></el-icon>
    <span class="toggle-summary">
      <template v-if="hasFailure">
        <el-icon class="toggle-warning"><WarningFilled /></el-icon>
        {{ failedStageNames.join('、') }} 失败
      </template>
      <template v-else-if="hasCancelled">
        <el-icon class="toggle-cancelled"><Remove /></el-icon>
        {{ cancelledStageNames.join('、') }} 已取消
      </template>
      <template v-else-if="isStreaming">
        正在生成...
      </template>
      <template v-else>
        {{ completedCount }}/{{ total }} 步骤完成
      </template>
    </span>
    <span v-if="!isStreaming" class="toggle-duration">
      {{ totalDuration }}
    </span>
    <el-button v-if="isStreaming" size="small" type="danger" plain class="toggle-cancel" @click.stop="cancelFn?.()">
      取消
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, WarningFilled, Remove } from '@element-plus/icons-vue'

defineProps<{
  collapsed: boolean
  isStreaming?: boolean
  hasFailure: boolean
  hasCancelled: boolean
  completedCount: number
  total: number
  failedStageNames: string[]
  cancelledStageNames: string[]
  totalDuration: string
  cancelFn?: () => void
}>()

defineEmits<{
  toggle: []
}>()
</script>

<style scoped>
.stage-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  user-select: none;
}

.stage-toggle:hover {
  background: #f5f7fa;
}

.toggle-arrow {
  font-size: 14px;
  transition: transform 0.2s;
}

.toggle-arrow.expanded {
  transform: rotate(90deg);
}

.toggle-warning {
  color: #f56c6c;
  margin-right: 4px;
}

.toggle-cancelled {
  color: #e6a23c;
  margin-right: 4px;
}

.toggle-duration {
  margin-left: auto;
  font-size: 12px;
  color: #c0c4cc;
}

.stage-toggle.has-failure {
  color: #f56c6c;
}

.stage-toggle.has-cancelled {
  color: #e6a23c;
}

.toggle-cancel {
  margin-left: auto;
}
</style>
