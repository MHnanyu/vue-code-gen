<template>
  <div class="mb-2">
    <div
      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all duration-300"
      :class="statusClass"
    >
      <el-icon v-if="status === 'calling'" class="is-loading"><Loading /></el-icon>
      <el-icon v-else-if="status === 'completed'" class="text-green-500"><CircleCheck /></el-icon>
      <el-icon v-else-if="status === 'failed'" class="text-red-500"><CircleClose /></el-icon>
      <span class="transition-all duration-300">{{ label }}</span>
      <span v-if="duration != null && status === 'completed'" class="text-gray-400">{{ duration.toFixed(1) }}s</span>
      <template v-if="outputPaths && outputPaths.length > 0 && status === 'completed'">
        <span
          class="text-xs text-blue-500 cursor-pointer hover:underline"
          @click="$emit('view-output', outputPaths[0])"
        >
          查看产物
        </span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'

const props = defineProps<{
  toolName: string
  label: string
  status: 'calling' | 'completed' | 'failed'
  outputPaths: string[] | null
  renderType: 'text' | 'code' | null
  duration?: number
}>()

defineEmits<{
  'view-output': [url: string]
}>()

const statusClass = computed(() => {
  switch (props.status) {
    case 'calling':
      return 'bg-blue-50 border-blue-200 text-blue-700'
    case 'completed':
      return 'bg-green-50 border-green-200 text-green-700'
    case 'failed':
      return 'bg-red-50 border-red-200 text-red-700'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700'
  }
})
</script>
