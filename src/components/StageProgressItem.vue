<template>
  <div
    class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md cursor-pointer transition-colors duration-200 min-h-12 hover:bg-gray-100"
    :class="{ 'bg-blue-50': stage.status === 'running' }"
  >
    <div class="flex flex-col items-center w-5 shrink-0" @click="$emit('click', stage)">
      <div
        v-if="index > 0"
        class="w-0.5 flex-1 min-h-1"
        :class="topLineClass === 'line-done' ? 'bg-green-500' : 'bg-gray-300'"
      />
      <div v-else class="flex-1 min-h-1" />
      <div
        class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs"
        :class="iconStyle"
      >
        <el-icon v-if="stage.status === 'running'" class="is-loading"><Loading /></el-icon>
        <el-icon v-else-if="stage.status === 'success'"><Check /></el-icon>
        <el-icon v-else-if="stage.status === 'cached'"><Check /></el-icon>
        <el-icon v-else-if="stage.status === 'skipped'"><SemiSelect /></el-icon>
        <el-icon v-else-if="stage.status === 'failed'"><WarningFilled /></el-icon>
        <el-icon v-else-if="stage.status === 'cancelled'"><Remove /></el-icon>
        <span v-else class="w-1.5 h-1.5 rounded-full bg-gray-300" />
      </div>
      <div
        v-if="index < total - 1"
        class="w-0.5 flex-1 min-h-1"
        :class="bottomLineClass === 'line-done' ? 'bg-green-500' : 'bg-gray-300'"
      />
      <div v-else class="flex-1 min-h-1" />
    </div>
    <div class="flex-1 min-w-0 p-0 flex flex-col justify-center min-h-11" @click="$emit('click', stage)">
      <div class="flex items-center gap-1.5">
        <span class="text-[13px] font-medium text-gray-800">{{ STAGE_NAME_MAP[stage.stageName] || stage.stageName }}</span>
        <el-tag v-if="stage.status === 'cached'" size="small" type="info" class="scale-85 align-middle">缓存</el-tag>
        <el-tag v-else-if="stage.status === 'skipped'" size="small" type="info" class="scale-85 align-middle">跳过</el-tag>
        <el-tag v-else-if="stage.status === 'cancelled'" size="small" type="warning" class="scale-85 align-middle">已取消</el-tag>
      </div>
      <div class="flex items-center gap-2 mt-1">
        <span v-if="stage.duration != null" class="inline-flex items-center gap-0.5 text-xs text-gray-400">
          <el-icon class="text-xs"><Timer /></el-icon>
          {{ stage.duration.toFixed(1) }}s
        </span>
        <div
          v-if="stage.progressMessage"
          class="stage-progress-text text-xs text-blue-500 max-h-[260px] overflow-y-auto"
          :class="{ 'text-success': stage.status === 'success' || stage.status === 'cached' }"
          v-html="renderMarkdown(stage.progressMessage)"
        />
      </div>
      <div v-if="stage.status === 'failed'" class="mt-1 text-xs text-red-500">
        {{ stage.progressMessage || '步骤执行失败' }}
      </div>
    </div>
    <span
      v-if="retryFn && isRetryable && !isStreaming"
      class="text-xs text-amber-500 cursor-pointer ml-auto shrink-0 self-center px-1.5 py-0.5 rounded transition-colors duration-200 hover:bg-amber-50"
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

const iconStyle = computed(() => {
  switch (props.stage.status) {
    case 'running': return 'bg-blue-500 text-white'
    case 'success': return 'bg-green-500 text-white'
    case 'cached': return 'bg-amber-400 text-white'
    case 'skipped': return 'bg-amber-400 text-white opacity-60'
    case 'failed': return 'bg-red-400 text-white'
    case 'cancelled': return 'bg-amber-400 text-white opacity-70'
    default: return 'border-2 border-gray-300'
  }
})
</script>

<style scoped>
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
</style>
