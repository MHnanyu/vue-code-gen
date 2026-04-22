<template>
  <div class="flex-1 overflow-hidden flex flex-col">
    <el-tabs v-if="contentTabs.length > 0" v-model="activeTab" type="border-card" class="agent-tabs h-full flex flex-col">
      <el-tab-pane
        v-for="tab in contentTabs"
        :key="tab.key"
        :label="tab.label"
        :name="tab.key"
      >
        <div class="h-full overflow-hidden" v-memo="[tab.key, getContent(tab.key), persistedContentCache.get(tab.key)]">
          <template v-if="tab.type === 'markdown'">
            <MarkdownPreview
              v-if="getMarkdownContent(tab.key)"
              :content="getMarkdownContent(tab.key)"
              :loading="false"
            />
            <el-skeleton v-else-if="isPersistedLoading(tab.key)" :loading="true" animated>
              <template #template>
                <div class="flex flex-col items-center justify-center h-[200px] gap-3 text-gray-400 text-sm">
                  <el-icon class="is-loading" :size="28"><Loading /></el-icon>
                  <span>加载中...</span>
                </div>
              </template>
            </el-skeleton>
            <el-empty v-else description="该步骤无可用预览" :image-size="60" />
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
            <el-skeleton v-else-if="isPersistedLoading(tab.key)" :loading="true" animated>
              <template #template>
                <div class="flex flex-col items-center justify-center h-[200px] gap-3 text-gray-400 text-sm">
                  <el-icon class="is-loading" :size="28"><Loading /></el-icon>
                  <span>加载中...</span>
                </div>
              </template>
            </el-skeleton>
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
import { fetchStageFile, type ApiFile } from '@/api'
import { apiFilesToProjectFiles } from '@/utils/files'
import { AGENT_TOOL_LABELS, buildCompletedLabel } from '@/constants/agent'
import type { ToolCallContent } from '@/composables/useAgentState'
import type { AgentToolCallRecord } from '@/types'
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

function getOutputType(toolName: string, renderType: string | null | undefined): 'markdown' | 'vue' | null {
  if (renderType === 'code') return 'vue'
  if (renderType === 'text') return 'markdown'
  if (toolName === 'generate_vue_code' || toolName === 'optimize_ux') return 'vue'
  return 'markdown'
}

const contentTabs = computed<ContentTab[]>(() => {
  const tabs: ContentTab[] = []
  const usedToolNames = new Set<string>()

  for (const tc of agentState.toolCalls) {
    const toolName = tc.toolName
    if (usedToolNames.has(toolName)) continue
    usedToolNames.add(toolName)

    if (!tc.outputPaths?.length && tc.status !== 'calling') continue

    const content = agentState.toolCallContents.get(toolName)
    if (content) {
      tabs.push({
        key: toolName,
        label: tc.label || toolName,
        type: content.type,
        status: tc.status,
      })
    } else if (tc.status === 'calling' || (tc.status === 'completed' && tc.renderType)) {
      tabs.push({
        key: toolName,
        label: tc.label || toolName,
        type: 'loading',
        status: tc.status,
      })
    }
  }

  if (tabs.length === 0) {
    const session = chatStore.currentSession
    if (session?.messages) {
      for (const msg of session.messages) {
        if (msg.role === 'assistant' && msg.toolCalls?.length) {
          for (const tc of msg.toolCalls as AgentToolCallRecord[]) {
            if (usedToolNames.has(tc.toolName)) continue
            if (!tc.outputPaths?.length) continue
            usedToolNames.add(tc.toolName)

            const label = tc.status === 'success'
              ? buildCompletedLabel(tc.toolName, tc.result, tc.message, tc.outputPaths, tc.duration, tc.arguments)
              : AGENT_TOOL_LABELS[tc.toolName] || tc.toolName
            const type = getOutputType(tc.toolName, tc.renderType)
            if (type) {
              tabs.push({
                key: tc.toolName,
                label,
                type,
                status: tc.status === 'success' ? 'completed' : 'failed',
              })
            }
          }
        }
      }
    }
  }

  return tabs
})

const persistedContentCache = ref<Map<string, { type: 'markdown' | 'vue'; content: string | null; files: ApiFile[] | null }>>(new Map())
const persistedLoadingMap = ref<Map<string, boolean>>(new Map())

function findPersistedToolCall(toolName: string): AgentToolCallRecord | null {
  const session = chatStore.currentSession
  if (!session?.messages) return null
  for (const msg of session.messages) {
    if (msg.role === 'assistant' && msg.toolCalls?.length) {
      const found = msg.toolCalls.find((tc: AgentToolCallRecord) => tc.toolName === toolName)
      if (found) return found as AgentToolCallRecord
    }
  }
  return null
}

async function ensurePersistedContentLoaded(toolName: string) {
  if (persistedContentCache.value.has(toolName)) return
  if (persistedLoadingMap.value.get(toolName)) return

  const tc = findPersistedToolCall(toolName)
  if (!tc?.outputPaths?.length) return

  const type = getOutputType(tc.toolName, tc.renderType)
  if (!type) return

  persistedLoadingMap.value.set(toolName, true)
  try {
    if (type === 'markdown') {
      const content = await fetchStageFile(tc.outputPaths![0])
      persistedContentCache.value.set(toolName, { type, content, files: null })
    } else if (type === 'vue') {
      const fetchResults = await Promise.allSettled(
        tc.outputPaths!.map(async (fp) => {
          const code = await fetchStageFile(fp)
          const fileName = fp.split('/').pop() || 'Unknown.vue'
          return {
            id: `persisted_${fp}`,
            name: fileName,
            path: fp,
            type: 'file' as const,
            language: 'vue' as const,
            content: code,
          } as ApiFile
        }),
      )
      const files = fetchResults
        .filter((r): r is PromiseFulfilledResult<ApiFile> => r.status === 'fulfilled')
        .map(r => r.value)
      persistedContentCache.value.set(toolName, { type, content: null, files })
    }
  } catch (e) {
    console.warn('Failed to load persisted content for', toolName, e)
  } finally {
    persistedLoadingMap.value.delete(toolName)
  }
}

function getContent(key: string): ToolCallContent | undefined {
  return agentState.toolCallContents.get(key)
}

function getMarkdownContent(key: string): string | null {
  const c = agentState.toolCallContents.get(key)
  if (c?.type === 'markdown') return c.content
  const cached = persistedContentCache.value.get(key)
  if (cached?.type === 'markdown') return cached.content
  return null
}

function getVueFiles(key: string): ApiFile[] | null {
  const c = agentState.toolCallContents.get(key)
  if (c?.type === 'vue') return c.files
  const cached = persistedContentCache.value.get(key)
  if (cached?.type === 'vue') return cached.files
  return null
}

function isPersistedLoading(key: string): boolean {
  return persistedLoadingMap.value.get(key) ?? false
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

watch(activeTab, async (key) => {
  if (key && !agentState.toolCallContents.has(key)) {
    await ensurePersistedContentLoaded(key)
  }
})

watch(() => chatStore.currentSessionId, () => {
  activeTab.value = ''
  persistedContentCache.value.clear()
  persistedLoadingMap.value.clear()
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
