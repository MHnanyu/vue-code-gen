<template>
  <div class="mb-2">
    <div
      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all duration-200"
      :class="statusClass"
    >
      <el-icon v-if="status === 'calling'" class="is-loading"><Loading /></el-icon>
      <el-icon v-else-if="status === 'completed'" class="text-green-500"><CircleCheck /></el-icon>
      <el-icon v-else-if="status === 'failed'" class="text-red-500"><CircleClose /></el-icon>
      <span>{{ label }}</span>
      <template v-if="outputUrls.length > 0">
        <span
          class="text-xs text-blue-500 cursor-pointer hover:underline"
          @click="$emit('view-output', outputUrls[0])"
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
  outputUrls: string[]
  outputType: 'file' | 'files' | null
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
