<template>
  <div class="mb-3">
    <StageProgress
      v-if="stages.length > 0"
      :stages="stages"
      :is-streaming="isStreaming"
      :retry-fn="retryFn"
      :cancel-fn="cancelFn"
      @stage-click="$emit('stage-click', $event)"
    />
  </div>
  <div class="flex gap-3 mb-5">
    <div class="flex-shrink-0">
      <el-avatar :size="32" style="background: #67c23a">AI</el-avatar>
    </div>
    <div class="max-w-[80%]">
      <div class="px-4 py-3 rounded-xl bg-gray-100 inline-flex items-center">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span class="ml-2 text-gray-500">{{ label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
import type { StageProgressState } from '@/types'
import StageProgress from '@/components/StageProgress.vue'

defineProps<{
  stages: StageProgressState[]
  isStreaming: boolean
  retryFn?: (stage: number) => void
  cancelFn?: () => void
  label: string
}>()

defineEmits<{
  'stage-click': [stage: StageProgressState]
}>()
</script>
