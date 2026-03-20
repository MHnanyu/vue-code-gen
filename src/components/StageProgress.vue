<template>
  <div class="stage-progress">
    <div class="stage-list">
      <div
        v-for="(stage, index) in stages"
        :key="stage.stage"
        class="stage-item"
        :class="{ active: stage.status === 'running' }"
        @click="handleStageClick(stage)"
      >
        <div class="stage-left">
          <div
            v-if="index > 0"
            class="stage-line"
            :class="topLineClass(index)"
          />
          <div v-else class="stage-line-spacer" />
          <div class="stage-icon" :class="iconClass(stage)">
            <el-icon v-if="stage.status === 'running'" class="is-loading"><Loading /></el-icon>
            <el-icon v-else-if="stage.status === 'success'"><Check /></el-icon>
            <el-icon v-else-if="stage.status === 'cached'"><Check /></el-icon>
            <el-icon v-else-if="stage.status === 'failed'"><WarningFilled /></el-icon>
            <span v-else class="stage-dot" />
          </div>
          <div
            v-if="index < stages.length - 1"
            class="stage-line"
            :class="bottomLineClass(stage)"
          />
          <div v-else class="stage-line-spacer" />
        </div>
        <div class="stage-right">
          <div class="stage-header">
            <span class="stage-name">{{ STAGE_NAME_MAP[stage.stageName] || stage.stageName }}</span>
            <el-tag v-if="stage.status === 'cached'" size="small" type="info" class="stage-badge">缓存</el-tag>
            <el-tag v-else-if="stage.status === 'skipped'" size="small" type="info" class="stage-badge">跳过</el-tag>
          </div>
          <div class="stage-meta">
            <span v-if="stage.duration != null" class="stage-duration">
              <el-icon><Timer /></el-icon>
              {{ stage.duration.toFixed(1) }}s
            </span>
            <span v-if="stage.status === 'running'" class="stage-progress-text">
              {{ stage.progressMessage || '处理中...' }}
            </span>
          </div>
          <div v-if="stage.status === 'failed'" class="stage-error">
            {{ stage.progressMessage || '步骤执行失败' }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="showActions" class="stage-actions">
      <template v-if="isStreaming">
        <el-button size="small" type="danger" plain @click="onCancel?.()">
          <el-icon class="mr-1"><Close /></el-icon>
          取消生成
        </el-button>
      </template>
      <template v-else>
        <el-button
          v-for="stage in retryableStages"
          :key="stage.stage"
          size="small"
          type="warning"
          plain
          @click="onRetry?.(stage.stage)"
        >
          从「{{ STAGE_NAME_MAP[stage.stageName] || stage.stageName }}」重试
        </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Close, Loading, WarningFilled, Timer } from '@element-plus/icons-vue'
import type { StageProgressState } from '@/types'

const STAGE_NAME_MAP: Record<string, string> = {
  attachment: '附件处理',
  requirement: '需求标准化',
  generation: '代码生成',
  optimization: 'UX 优化',
  iteration: '迭代修改',
}

const props = defineProps<{
  stages: StageProgressState[]
  isStreaming?: boolean
  onRetry?: (stage: number) => void
  onCancel?: () => void
}>()

const emit = defineEmits<{
  'stage-click': [stage: StageProgressState]
}>()

const retryableStages = computed(() => {
  return props.stages.filter(
    s => s.status === 'success' || s.status === 'cached' || s.status === 'failed' || s.status === 'skipped',
  )
})

const showActions = computed(() => {
  return props.isStreaming || retryableStages.value.length > 0
})

function topLineClass(index: number): string {
  const prev = props.stages[index - 1]
  if (prev && (prev.status === 'success' || prev.status === 'cached')) return 'line-done'
  return 'line-pending'
}

function bottomLineClass(stage: StageProgressState): string {
  if (stage.status === 'success' || stage.status === 'cached') return 'line-done'
  return 'line-pending'
}

function iconClass(stage: StageProgressState) {
  switch (stage.status) {
    case 'running': return 'icon-running'
    case 'success': return 'icon-success'
    case 'cached': return 'icon-cached'
    case 'failed': return 'icon-failed'
    default: return 'icon-pending'
  }
}

function handleStageClick(stage: StageProgressState) {
  emit('stage-click', stage)
}
</script>

<style scoped>
.stage-progress {
  padding: 12px 0;
}

.stage-list {
  display: flex;
  flex-direction: column;
}

.stage-item {
  display: flex;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.stage-item:hover {
  background: #f5f7fa;
}

.stage-item.active {
  background: #ecf5ff;
}

.stage-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}

.stage-line {
  width: 2px;
  flex: 1;
  min-height: 4px;
}

.line-done {
  background: #67c23a;
}

.line-pending {
  background: #dcdfe6;
}

.stage-line-spacer {
  flex: 1;
  min-height: 4px;
}

.stage-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 12px;
}

.icon-success {
  background: #67c23a;
  color: #fff;
}

.icon-cached {
  background: #e6a23c;
  color: #fff;
}

.icon-running {
  background: #409eff;
  color: #fff;
}

.icon-failed {
  background: #f56c6c;
  color: #fff;
}

.icon-pending {
  border: 2px solid #dcdfe6;
}

.stage-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #dcdfe6;
}

.stage-right {
  flex: 1;
  min-width: 0;
  padding: 1px 0;
}

.stage-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stage-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.stage-badge {
  transform: scale(0.85);
}

.stage-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.stage-duration {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  color: #909399;
}

.stage-duration .el-icon {
  font-size: 11px;
}

.stage-progress-text {
  font-size: 11px;
  color: #409eff;
}

.stage-error {
  margin-top: 2px;
  font-size: 11px;
  color: #f56c6c;
}

.stage-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px 0;
  margin-top: 4px;
  border-top: 1px solid #ebeef5;
}
</style>
