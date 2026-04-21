<template>
  <div v-if="isStreaming" class="mb-5">
    <div class="flex gap-3">
      <div class="flex-shrink-0">
        <el-avatar :size="32" style="background: #e6a23c">AI</el-avatar>
      </div>
      <div class="flex-1 min-w-0 max-w-[80%]">
        <AgentThinkingBubble :thinking-content="thinkingContent" />

        <template v-for="(tc, idx) in toolCalls" :key="idx">
          <AgentToolCallCard
            :tool-name="tc.toolName"
            :label="tc.label"
            :status="tc.status"
            :output-urls="tc.outputUrls"
            :output-type="tc.outputType"
            @view-output="(url: string) => emit('view-output', url)"
          />
        </template>

        <div v-if="toolCalls.length === 0 && !thinkingContent" class="px-4 py-3 rounded-xl bg-gray-100 inline-flex items-center">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span class="ml-2 text-gray-500">正在思考...</span>
        </div>

        <div v-if="isDone" class="px-4 py-3 rounded-xl bg-gray-100 inline-flex items-center text-green-600">
          <el-icon><CircleCheck /></el-icon>
          <span class="ml-2">生成完成，正在加载代码...</span>
        </div>

        <div v-if="errorMessage" class="px-4 py-3 rounded-xl bg-red-50 inline-flex items-center text-red-600">
          <span>{{ errorMessage }}</span>
        </div>
      </div>
    </div>

    <div v-if="isStreaming && !isDone && !errorMessage" class="ml-11 mt-2">
      <el-button
        v-if="cancelFn"
        size="small"
        type="danger"
        text
        @click="cancelFn"
      >
        取消生成
      </el-button>
    </div>

    <div v-if="errorMessage" class="ml-11 mt-2">
      <el-button
        size="small"
        type="primary"
        text
        @click="emit('retry')"
      >
        重新生成
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading, CircleCheck } from '@element-plus/icons-vue'
import type { AgentToolCallState } from '@/types'
import AgentThinkingBubble from '@/components/agent/AgentThinkingBubble.vue'
import AgentToolCallCard from '@/components/agent/AgentToolCallCard.vue'

defineProps<{
  isStreaming: boolean
  thinkingContent: string
  toolCalls: AgentToolCallState[]
  isDone: boolean
  errorMessage: string | null
  cancelFn?: () => void
}>()

const emit = defineEmits<{
  'view-output': [url: string]
  'retry': []
}>()
</script>
