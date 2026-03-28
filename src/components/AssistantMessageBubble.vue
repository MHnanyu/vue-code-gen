<template>
  <div>
    <div class="mb-3">
      <StageProgress
        v-if="showProgress"
        :stages="progressStages"
        :is-streaming="isLast && isRetrying && isStreaming"
        :retry-fn="retryFn"
        @stage-click="(stage: StageProgressState) => emit('stage-click', stage)"
      />
    </div>

    <div class="flex gap-3 mb-5">
      <div class="flex-shrink-0">
        <el-avatar :size="32" style="background: #67c23a">AI</el-avatar>
      </div>
      <div class="max-w-[80%]">
        <div class="px-4 py-3 rounded-xl leading-relaxed break-words bg-gray-100">
          <template v-if="isLast && isRetrying && isStreaming">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span class="ml-1">正在重试...</span>
          </template>
          <template v-else>
            {{ message.content }}
          </template>
        </div>
      </div>
    </div>

    <div v-if="showError" class="mb-3 px-11">
      <div class="text-xs text-red-500">
        <template v-for="(stage, key) in message.stages" :key="key">
          <span v-if="stage?.status === 'error' || stage?.status === 'failed'" class="mr-2">
            {{ STAGE_NAME_MAP[key as keyof typeof STAGE_NAME_MAP] || key }}: {{ stage?.error }}
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'
import { STAGE_NAME_MAP } from '@/constants/stages'
import type { ChatMessage, StageProgressState } from '@/types'
import StageProgress from '@/components/StageProgress.vue'

defineProps<{
  message: ChatMessage
  index: number
  showProgress: boolean
  progressStages: StageProgressState[]
  isLast: boolean
  isRetrying: boolean
  isStreaming: boolean
  showError: boolean
  retryFn: ((stage: number) => void) | undefined
}>()

const emit = defineEmits<{
  'stage-click': [stage: StageProgressState]
}>()
</script>
