<template>
  <div
    class="flex items-center gap-2 px-2.5 py-1.5 rounded-md cursor-pointer text-[13px] text-gray-600 select-none hover:bg-gray-100"
    :class="{ 'text-red-500': hasFailure, 'text-amber-500': !hasFailure && hasCancelled }"
    @click="$emit('toggle')"
  >
    <el-icon
      class="text-sm transition-transform duration-200"
      :class="{ 'rotate-90': !collapsed }"
    ><ArrowRight /></el-icon>
    <span>
      <template v-if="hasFailure">
        <el-icon class="text-red-400 mr-1"><WarningFilled /></el-icon>
        {{ failedStageNames.join('、') }} 失败
      </template>
      <template v-else-if="hasCancelled">
        <el-icon class="text-amber-400 mr-1"><Remove /></el-icon>
        {{ cancelledStageNames.join('、') }} 已取消
      </template>
      <template v-else-if="isStreaming">
        正在生成...
      </template>
      <template v-else>
        {{ completedCount }}/{{ total }} 步骤完成
      </template>
    </span>
    <span v-if="!isStreaming" class="ml-auto text-xs text-gray-300">
      {{ totalDuration }}
    </span>
    <el-button v-if="isStreaming" size="small" type="danger" plain class="ml-auto" @click.stop="cancelFn?.()">
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

