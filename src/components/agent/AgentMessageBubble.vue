<template>
  <div>
    <div class="mb-2">
      <AgentThinkingBubble
        v-if="metadata.thinkingContent"
        :thinking-content="metadata.thinkingContent"
      />
    </div>

    <div class="mb-2" v-if="metadata.toolCalls.length > 0">
      <template v-for="(tc, idx) in metadata.toolCalls" :key="idx">
        <AgentToolCallCard
          :tool-name="tc.toolName"
          :label="tc.label"
          :status="tc.status"
          :output-urls="tc.outputUrls"
          :output-type="tc.outputType"
          @view-output="(url: string) => emit('view-output', url)"
        />
      </template>
    </div>

    <div v-if="stepMessages.length > 0 && !showToolCallCards" class="mb-2">
      <template v-for="(sm, idx) in stepMessages" :key="idx">
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border mb-1"
          :class="stepMessageClass(sm)"
        >
          <el-icon v-if="sm.status === 'success'" class="text-green-500"><CircleCheck /></el-icon>
          <el-icon v-else-if="sm.status === 'failed'" class="text-red-500"><CircleClose /></el-icon>
          <span>{{ sm.stageName }}</span>
          <span v-if="sm.duration" class="text-gray-400">{{ (sm.duration / 1000).toFixed(1) }}s</span>
          <template v-if="sm.filePath && sm.filePath.length > 0">
            <span
              v-if="sm.fileCategory === 'file' || sm.filePath.length === 1"
              class="text-blue-500 cursor-pointer hover:underline"
              @click="emit('view-output', sm.filePath![0])"
            >
              查看产物
            </span>
            <template v-else>
              <span
                v-for="(fp, fpIdx) in sm.filePath"
                :key="fpIdx"
                class="text-blue-500 cursor-pointer hover:underline"
                @click="emit('view-output', fp)"
              >
                {{ fpIdx === 0 ? '查看产物' : ' / ' }}{{ fpIdx > 0 ? stepFileName(fp) : '' }}
              </span>
            </template>
          </template>
        </div>
      </template>
    </div>

    <div class="flex gap-3 mb-5">
      <div class="flex-shrink-0">
        <el-avatar :size="32" style="background: #e6a23c">AI</el-avatar>
      </div>
      <div class="max-w-[80%]">
        <div
          class="px-4 py-3 rounded-xl leading-relaxed break-words"
          :class="statusContentClass"
        >
          {{ displayContent }}
        </div>
        <div v-if="metadata.files && metadata.files.length > 0" class="mt-1 text-xs text-gray-400">
          共 {{ metadata.files.length }} 个文件
        </div>
        <div v-if="isFailedOrCancelled" class="mt-2">
          <el-button size="small" type="primary" text @click="emit('retry')">
            重新生成
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import type { ChatMessage, AgentMessageMetadata, StepMessage } from '@/types'
import AgentThinkingBubble from '@/components/agent/AgentThinkingBubble.vue'
import AgentToolCallCard from '@/components/agent/AgentToolCallCard.vue'

const props = defineProps<{
  message: ChatMessage
}>()

const emit = defineEmits<{
  'view-output': [url: string]
  'retry': []
}>()

const metadata: AgentMessageMetadata = props.message.agentMetadata || {
  thinkingContent: '',
  toolCalls: [],
  files: [],
}

const stepMessages = computed<StepMessage[]>(() => props.message.stepMessages || [])

const showToolCallCards = computed(() => metadata.toolCalls.length > 0)

const isFailedOrCancelled = computed(() =>
  props.message.content.startsWith('Agent 执行异常') ||
  props.message.content.startsWith('用户取消了生成') ||
  props.message.content === '正在生成中...',
)

const displayContent = computed(() => {
  const c = props.message.content
  if (c === 'Agent 模式生成完成') {
    return metadata.files && metadata.files.length > 0
      ? `生成完成，共 ${metadata.files.length} 个文件`
      : c
  }
  if (c === '正在生成中...') {
    return '生成中断（页面刷新或连接断开）'
  }
  if (c.startsWith('Agent 执行异常:')) {
    return c
  }
  if (c === '用户取消了生成') {
    return c
  }
  return c
})

const statusContentClass = computed(() => {
  const c = props.message.content
  if (c === 'Agent 模式生成完成') return 'bg-green-50 text-green-700'
  if (c.startsWith('Agent 执行异常')) return 'bg-red-50 text-red-700'
  if (c === '用户取消了生成' || c === '正在生成中...') return 'bg-yellow-50 text-yellow-700'
  return 'bg-gray-100'
})

function stepMessageClass(sm: StepMessage) {
  if (sm.status === 'success') return 'bg-green-50 border-green-200 text-green-700'
  if (sm.status === 'failed') return 'bg-red-50 border-red-200 text-red-700'
  return 'bg-gray-50 border-gray-200 text-gray-600'
}

function stepFileName(path: string): string {
  return path.split('/').pop() || path
}
</script>
