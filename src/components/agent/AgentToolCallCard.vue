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
      <span v-if="duration != null && duration > 0 && status === 'completed'" class="text-gray-400">{{ duration.toFixed(1) }}s</span>
      <template v-if="outputPaths && outputPaths.length > 0 && status === 'completed'">
        <span
          class="text-xs text-blue-500 cursor-pointer hover:underline"
          @click="$emit('view-output', outputPaths[0])"
        >
          查看产物
        </span>
      </template>
      <span
        v-if="hasDetail"
        class="ml-1 cursor-pointer select-none text-gray-400 hover:text-gray-600 transition-colors"
        @click="expanded = !expanded"
      >
        <el-icon :class="{ 'rotate-90': expanded }" style="transition: transform 0.2s"><ArrowRight /></el-icon>
      </span>
    </div>
    <div v-if="hasDetail && expanded" class="mt-1 ml-1 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 overflow-auto max-h-60">
      <div v-if="parsedArgs" class="px-3 py-2 border-b border-gray-100">
        <div class="text-gray-400 mb-1 font-medium">参数</div>
        <pre class="whitespace-pre-wrap break-words">{{ parsedArgs }}</pre>
      </div>
      <div v-if="parsedResult" class="px-3 py-2">
        <div class="text-gray-400 mb-1 font-medium">结果</div>
        <pre class="whitespace-pre-wrap break-words">{{ parsedResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loading, CircleCheck, CircleClose, ArrowRight } from '@element-plus/icons-vue'

const props = defineProps<{
  toolName: string
  label: string
  status: 'calling' | 'completed' | 'failed'
  outputPaths: string[] | null
  renderType: 'text' | 'code' | null
  duration?: number
  arguments?: string
  result?: Record<string, any> | string | null
  message?: string | null
}>()

defineEmits<{
  'view-output': [url: string]
}>()

const expanded = ref(false)

const parsedArgs = computed(() => {
  if (!props.arguments) return null
  try {
    const obj = JSON.parse(props.arguments)
    return JSON.stringify(obj, null, 2)
  } catch {
    return props.arguments
  }
})

const parsedResult = computed(() => {
  if (!props.result && !props.message) return null
  if (props.message) return props.message
  if (typeof props.result === 'string') return props.result
  return JSON.stringify(props.result, null, 2)
})

const hasDetail = computed(() => !!parsedArgs.value || !!parsedResult.value)

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
