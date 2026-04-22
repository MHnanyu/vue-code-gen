<template>
  <div class="flex-1 overflow-hidden flex flex-col">
    <el-tabs v-if="contentTabs.length > 0" v-model="activeTab" type="border-card" class="agent-tabs h-full flex flex-col">
      <el-tab-pane
        v-for="tab in contentTabs"
        :key="tab.key"
        :label="tab.label"
        :name="tab.key"
      >
        <div class="h-full overflow-hidden" v-memo="[tab.key, getContent(tab.key)]">
          <template v-if="tab.type === 'markdown'">
            <MarkdownPreview
              :content="getMarkdownContent(tab.key)"
              :loading="false"
            />
          </template>
          <template v-else-if="tab.type === 'vue'">
            <VueReplPreview
              v-if="getVueFiles(tab.key)"
              class="h-full"
              :files="apiFilesToProjectFiles(getVueFiles(tab.key)!, chatStore.currentSession?.componentLib)"
              :show-toolbar="false"
              empty-text="暂无 Vue 产物"
              empty-icon="📄"
            />
            <el-empty v-else description="该步骤无可用预览" :image-size="60" />
          </template>
          <template v-else-if="tab.status === 'calling'">
            <el-skeleton :loading="true" animated>
              <template #template>
                <div class="flex flex-col items-center justify-center h-[200px] gap-3 text-gray-400 text-sm">
                  <el-icon class="is-loading" :size="28"><Loading /></el-icon>
                  <span>执行中...</span>
                </div>
              </template>
            </el-skeleton>
          </template>
          <el-empty v-else description="该步骤无可用预览" :image-size="60" />
        </div>
      </el-tab-pane>
    </el-tabs>
    <div v-else class="flex-1 flex items-center justify-center text-gray-400 text-sm">
      等待产物生成...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { useChatStore } from '@/stores/chat'
import { apiFilesToProjectFiles } from '@/utils/files'
import type { ToolCallContent } from '@/composables/useAgentState'
import VueReplPreview from '@/components/VueReplPreview.vue'
import MarkdownPreview from '@/components/MarkdownPreview.vue'

const chatStore = useChatStore()
const agentState = chatStore.agentState

const activeTab = ref('')

interface ContentTab {
  key: string
  label: string
  type: 'markdown' | 'vue' | 'loading'
  status: string
}

const contentTabs = computed<ContentTab[]>(() => {
  const tabs: ContentTab[] = []
  const usedToolNames = new Set<string>()

  for (const tc of agentState.toolCalls) {
    const toolName = tc.toolName
    if (usedToolNames.has(toolName)) continue
    usedToolNames.add(toolName)

    const content = agentState.toolCallContents.get(toolName)
    if (content) {
      tabs.push({
        key: toolName,
        label: tc.label || toolName,
        type: content.type,
        status: tc.status,
      })
    } else if (tc.status === 'calling') {
      tabs.push({
        key: toolName,
        label: tc.label || toolName,
        type: 'loading',
        status: tc.status,
      })
    }
  }

  return tabs
})

function getContent(key: string): ToolCallContent | undefined {
  return agentState.toolCallContents.get(key)
}

function getMarkdownContent(key: string): string | null {
  const c = agentState.toolCallContents.get(key)
  if (c?.type === 'markdown') return c.content
  return null
}

function getVueFiles(key: string): any[] | null {
  const c = agentState.toolCallContents.get(key)
  if (c?.type === 'vue') return c.files
  return null
}

watch(() => chatStore.activeStageTab, (key) => {
  if (key && contentTabs.value.find(t => t.key === key)) {
    activeTab.value = key
  }
}, { flush: 'sync' })

watch(contentTabs, (tabs) => {
  if (tabs.length > 0 && !tabs.find(t => t.key === activeTab.value)) {
    activeTab.value = tabs[tabs.length - 1].key
  }
}, { immediate: true })

watch(() => chatStore.currentSessionId, () => {
  activeTab.value = ''
})
</script>

<style scoped>
.agent-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.agent-tabs :deep(.el-tab-pane) {
  height: 100%;
}
</style>
