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
          :output-url="tc.outputUrl"
          @view-output="(url: string) => emit('view-output', url)"
        />
      </template>
    </div>

    <div class="flex gap-3 mb-5">
      <div class="flex-shrink-0">
        <el-avatar :size="32" style="background: #e6a23c">AI</el-avatar>
      </div>
      <div class="max-w-[80%]">
        <div class="px-4 py-3 rounded-xl leading-relaxed break-words bg-gray-100">
          {{ message.content }}
        </div>
        <div v-if="metadata.files && metadata.files.length > 0" class="mt-1 text-xs text-gray-400">
          共 {{ metadata.files.length }} 个文件
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage, AgentMessageMetadata } from '@/types'
import AgentThinkingBubble from '@/components/agent/AgentThinkingBubble.vue'
import AgentToolCallCard from '@/components/agent/AgentToolCallCard.vue'

const props = defineProps<{
  message: ChatMessage
}>()

const emit = defineEmits<{
  'view-output': [url: string]
}>()

const metadata: AgentMessageMetadata = props.message.agentMetadata || {
  thinkingContent: '',
  toolCalls: [],
  files: [],
}
</script>
