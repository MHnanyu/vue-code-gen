<template>
  <div
    class="stage-item"
    :class="{ active: stage.status === 'running' }"
  >
    <div class="stage-left" @click="$emit('click', stage)">
      <div
        v-if="index > 0"
        class="stage-line"
        :class="topLineClass"
      />
      <div v-else class="stage-line-spacer" />
      <div class="stage-icon" :class="iconClass">
        <el-icon v-if="stage.status === 'running'" class="is-loading"><Loading /></el-icon>
        <el-icon v-else-if="stage.status === 'success'"><Check /></el-icon>
        <el-icon v-else-if="stage.status === 'cached'"><Check /></el-icon>
        <el-icon v-else-if="stage.status === 'skipped'"><SemiSelect /></el-icon>
        <el-icon v-else-if="stage.status === 'failed'"><WarningFilled /></el-icon>
        <el-icon v-else-if="stage.status === 'cancelled'"><Remove /></el-icon>
        <span v-else class="stage-dot" />
      </div>
      <div
        v-if="index < total - 1"
        class="stage-line"
        :class="bottomLineClass"
      />
      <div v-else class="stage-line-spacer" />
    </div>
    <div class="stage-right" @click="$emit('click', stage)">
      <div class="stage-header">
        <span class="stage-name">{{ STAGE_NAME_MAP[stage.stageName] || stage.stageName }}</span>
        <el-tag v-if="stage.status === 'cached'" size="small" type="info" class="stage-badge">缓存</el-tag>
        <el-tag v-else-if="stage.status === 'skipped'" size="small" type="info" class="stage-badge">跳过</el-tag>
        <el-tag v-else-if="stage.status === 'cancelled'" size="small" type="warning" class="stage-badge">已取消</el-tag>
      </div>
      <div class="stage-meta">
        <span v-if="stage.duration != null" class="stage-duration">
          <el-icon><Timer /></el-icon>
          {{ stage.duration.toFixed(1) }}s
        </span>
        <div
          v-if="stage.progressMessage"
          class="stage-progress-text"
          :class="{ 'text-success': stage.status === 'success' || stage.status === 'cached' }"
          v-html="renderMarkdown(stage.progressMessage)"
        />
      </div>
      <div v-if="stage.status === 'failed'" class="stage-error">
        {{ stage.progressMessage || '步骤执行失败' }}
      </div>
    </div>
    <span
      v-if="retryFn && isRetryable && !isStreaming"
      class="stage-retry-btn"
      @click.stop="retryFn(stage.stage)"
    >
      重试
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Loading, WarningFilled, Timer, SemiSelect, Remove } from '@element-plus/icons-vue'
import { marked } from 'marked'
import type { StageProgressState } from '@/types'
import { STAGE_NAME_MAP } from '@/constants/stages'

const props = defineProps<{
  stage: StageProgressState
  index: number
  total: number
  isStreaming?: boolean
  retryFn?: (stage: number) => void
  prevStage?: StageProgressState
}>()

defineEmits<{
  click: [stage: StageProgressState]
}>()

function renderMarkdown(text: string): string {
  const result = marked.parse(text)
  return typeof result === 'string' ? result : ''
}

function isDone(s: StageProgressState): boolean {
  return s.status === 'success' || s.status === 'cached' || s.status === 'skipped'
}

const isRetryable = computed(() =>
  props.stage.status === 'success' || props.stage.status === 'cached' ||
  props.stage.status === 'failed' || props.stage.status === 'skipped' ||
  props.stage.status === 'cancelled',
)

const topLineClass = computed(() =>
  props.prevStage && isDone(props.prevStage) ? 'line-done' : 'line-pending',
)

const bottomLineClass = computed(() =>
  isDone(props.stage) ? 'line-done' : 'line-pending',
)

const iconClass = computed(() => {
  switch (props.stage.status) {
    case 'running': return 'icon-running'
    case 'success': return 'icon-success'
    case 'cached': return 'icon-cached'
    case 'skipped': return 'icon-skipped'
    case 'failed': return 'icon-failed'
    case 'cancelled': return 'icon-cancelled'
    default: return 'icon-pending'
  }
})
</script>

<style scoped>
.stage-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 48px;
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

.icon-cancelled {
  background: #e6a23c;
  color: #fff;
  opacity: 0.7;
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 44px;
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
  vertical-align: middle;
}

.stage-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.stage-duration {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #909399;
}

.stage-duration .el-icon {
  font-size: 12px;
}

.stage-progress-text {
  font-size: 12px;
  color: #409eff;
  max-height: 260px;
  overflow-y: auto;
}

.stage-progress-text :deep(.markdown-body),
.stage-progress-text :deep(h1),
.stage-progress-text :deep(h2),
.stage-progress-text :deep(h3) {
  font-size: 12px;
  margin: 4px 0 2px;
  font-weight: 600;
}

.stage-progress-text :deep(p) {
  margin: 2px 0;
}

.stage-progress-text :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 4px 0;
}

.stage-progress-text :deep(th),
.stage-progress-text :deep(td) {
  border: 1px solid #ebeef5;
  padding: 2px 6px;
  text-align: left;
  font-size: 11px;
}

.stage-progress-text :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}

.stage-progress-text :deep(ul),
.stage-progress-text :deep(ol) {
  padding-left: 16px;
  margin: 2px 0;
}

.stage-progress-text :deep(li) {
  margin: 1px 0;
}

.stage-progress-text :deep(code) {
  background: #f5f7fa;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.stage-progress-text.text-success {
  color: #67c23a;
}

.stage-progress-text.text-success :deep(h1),
.stage-progress-text.text-success :deep(h2),
.stage-progress-text.text-success :deep(h3),
.stage-progress-text.text-success :deep(p),
.stage-progress-text.text-success :deep(li),
.stage-progress-text.text-success :deep(td),
.stage-progress-text.text-success :deep(th),
.stage-progress-text.text-success :deep(span) {
  color: #909399;
}

.stage-error {
  margin-top: 4px;
  font-size: 12px;
  color: #f56c6c;
}

.stage-retry-btn {
  font-size: 12px;
  color: #e6a23c;
  cursor: pointer;
  margin-left: auto;
  flex-shrink: 0;
  align-self: center;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;
}

.stage-retry-btn:hover {
  background: #fdf6ec;
}
</style>
