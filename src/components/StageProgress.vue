<template>
  <div class="stage-progress" :class="{ 'has-failure': hasFailure }">
    <div
      class="stage-toggle"
      @click="collapsed = !collapsed"
    >
      <el-icon class="toggle-arrow" :class="{ expanded: !collapsed }"><ArrowRight /></el-icon>
      <span class="toggle-summary">
        <template v-if="hasFailure">
          <el-icon class="toggle-warning"><WarningFilled /></el-icon>
          {{ failedStageNames.join('、') }} 失败
        </template>
        <template v-else-if="isStreaming">
          正在生成...
        </template>
        <template v-else>
          {{ completedCount }}/{{ stages.length }} 步骤完成
        </template>
      </span>
      <span v-if="!isStreaming" class="toggle-duration">
        {{ totalDuration }}
      </span>
    </div>
    <div v-show="!collapsed" class="stage-list">
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
            <el-icon v-else-if="stage.status === 'skipped'"><SemiSelect /></el-icon>
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

    <div v-if="!collapsed && showActions" class="stage-actions">
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
          {{ stage.stageName === 'iteration' ? '重试' : `从步骤${stage.stage}重试（${STAGE_NAME_MAP[stage.stageName] || stage.stageName}）` }}
        </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ArrowRight, Check, Close, Loading, WarningFilled, Timer, SemiSelect } from '@element-plus/icons-vue'
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

const hasFailure = computed(() => props.stages.some(s => s.status === 'failed'))

const completedCount = computed(() =>
  props.stages.filter(s => s.status === 'success' || s.status === 'cached' || s.status === 'skipped').length,
)

const failedStageNames = computed(() =>
  props.stages.filter(s => s.status === 'failed').map(s => STAGE_NAME_MAP[s.stageName] || s.stageName),
)

const totalDuration = computed(() => {
  const durations = props.stages.filter(s => s.duration != null).map(s => s.duration as number)
  if (durations.length === 0) return ''
  const total = durations.reduce((a, b) => a + b, 0)
  return `${total.toFixed(1)}s`
})

watch(() => props.isStreaming, (val) => {
  if (val) {
    collapsed.value = false
  }
})

const collapsed = ref(props.isStreaming ? false : !hasFailure.value)

watch(() => props.isStreaming, (val) => {
  if (val) {
    collapsed.value = false
  }
})

watch(() => props.stages, () => {
  if (!props.isStreaming) {
    collapsed.value = !hasFailure.value
  }
})

const retryableStages = computed(() => {
  if (!props.isStreaming) {
    return [...props.stages]
  }
  return props.stages.filter(
    s => s.status === 'success' || s.status === 'cached' || s.status === 'failed' || s.status === 'skipped',
  )
})

const showActions = computed(() => {
  return props.isStreaming || retryableStages.value.length > 0
})

function topLineClass(index: number): string {
  const prev = props.stages[index - 1]
  if (prev && (prev.status === 'success' || prev.status === 'cached' || prev.status === 'skipped')) return 'line-done'
  return 'line-pending'
}

function bottomLineClass(stage: StageProgressState): string {
  if (stage.status === 'success' || stage.status === 'cached' || stage.status === 'skipped') return 'line-done'
  return 'line-pending'
}

function iconClass(stage: StageProgressState) {
  switch (stage.status) {
    case 'running': return 'icon-running'
    case 'success': return 'icon-success'
    case 'cached': return 'icon-cached'
    case 'skipped': return 'icon-skipped'
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
  padding: 2px 0;
}

.stage-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #606266;
  user-select: none;
}

.stage-toggle:hover {
  background: #f5f7fa;
}

.stage-progress.has-failure .stage-toggle {
  color: #f56c6c;
}

.toggle-arrow {
  font-size: 12px;
  transition: transform 0.2s;
}

.toggle-arrow.expanded {
  transform: rotate(90deg);
}

.toggle-warning {
  color: #f56c6c;
  margin-right: 2px;
}

.toggle-duration {
  margin-left: auto;
  font-size: 11px;
  color: #c0c4cc;
}

.stage-list {
  display: flex;
  flex-direction: column;
}

.stage-item {
  display: flex;
  gap: 8px;
  padding: 3px 8px;
  border-radius: 4px;
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
  width: 18px;
  flex-shrink: 0;
}

.stage-line {
  width: 2px;
  flex: 1;
  min-height: 2px;
}

.line-done {
  background: #67c23a;
}

.line-pending {
  background: #dcdfe6;
}

.stage-line-spacer {
  flex: 1;
  min-height: 2px;
}

.stage-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
}

.icon-success {
  background: #67c23a;
  color: #fff;
}

.icon-cached {
  background: #e6a23c;
  color: #fff;
}

.icon-skipped {
  background: #e6a23c;
  color: #fff;
  opacity: 0.6;
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
  padding: 0;
}

.stage-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stage-name {
  font-size: 12px;
  font-weight: 500;
  color: #303133;
}

.stage-badge {
  transform: scale(0.85);
}

.stage-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 1px;
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
  margin-top: 1px;
  font-size: 11px;
  color: #f56c6c;
}

.stage-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 8px 0;
  margin-top: 2px;
  border-top: 1px solid #ebeef5;
}
</style>
