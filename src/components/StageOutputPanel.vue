<template>
  <div class="flex-1 overflow-hidden flex flex-col">
    <el-tabs v-model="activeStageKey" type="border-card" class="stage-tabs h-full flex flex-col">
      <el-tab-pane
        v-for="stage in completedStages"
        :key="stage._key"
        :label="stage._label"
        :name="stage._key"
      >
        <div class="h-full overflow-hidden" v-memo="[stage._key, getStageVueFiles(stage._key), getStageMarkdownContent(stage._key), stage.status]">
          <template v-if="stage._key.endsWith('_live') && stage.status === 'running'">
            <el-skeleton :loading="true" animated>
              <template #template>
                <div class="flex flex-col items-center justify-center h-[200px] gap-3 text-gray-400 text-sm">
                  <el-icon class="is-loading" :size="28"><Loading /></el-icon>
                  <span>生成中...</span>
                </div>
              </template>
            </el-skeleton>
          </template>
          <MarkdownPreview
            v-else-if="getStageOutputType(stage.stageName) === 'markdown'"
            :content="getStageMarkdownContent(stage._key)"
            :loading="stage.status === 'running'"
          />
          <VueReplPreview
            v-else-if="getStageOutputType(stage.stageName) === 'vue' && getStageVueFiles(stage._key)"
            class="h-full"
            :files="apiFilesToProjectFiles(getStageVueFiles(stage._key)!, chatStore.currentSession?.componentLib)"
            :show-toolbar="false"
            empty-text="暂无 Vue 产物"
            empty-icon="📄"
          />
          <el-empty v-else description="该步骤无可用预览" :image-size="60" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import { useChatStore } from '@/stores/chat'
import { fetchStageFile, fetchStageJson, type ApiFile } from '@/api'
import { apiFilesToProjectFiles, filterUserFiles } from '@/utils/files'
import VueReplPreview from '@/components/VueReplPreview.vue'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import { STAGE_NAME_MAP, INITIAL_STAGE_KEYS } from '@/constants/stages'

const projectStore = useProjectStore()
const chatStore = useChatStore()

const emit = defineEmits<{
  (e: 'has-stage-content-change', value: boolean): void
}>()

const activeStageKey = ref('')

interface CompletedStage {
  _key: string
  _label: string
  stage: number
  stageName: string
  status: string
  duration: number | null
}

const completedStages = computed<CompletedStage[]>(() => {
  const result: CompletedStage[] = []

  const session = chatStore.currentSession
  const allOutputs = session ? session.messages.flatMap(m => m.stepMessages || []) : []

  const usedKeys = new Set<string>()
  const nameIndex = new Map<string, number>()
  const coveredStageNames = new Set<string>()
  for (const output of allOutputs) {
    nameIndex.set(output.stageName, (nameIndex.get(output.stageName) || 0) + 1)
    const baseName = STAGE_NAME_MAP[output.stageName] || output.stageName
    const isInitial = INITIAL_STAGE_KEYS.includes(output.stageName)
    const key = isInitial ? output.stageName : `${output.stageName}_${nameIndex.get(output.stageName)}`
    const label = isInitial ? baseName : `${baseName} #${nameIndex.get(output.stageName)}`
    if (usedKeys.has(key)) continue
    usedKeys.add(key)
    coveredStageNames.add(output.stageName)
    result.push({
      _key: key,
      _label: label,
      stage: output.stage,
      stageName: output.stageName,
      status: output.status,
      duration: output.duration,
    })
  }

  const showLiveTab = chatStore.isStreaming && (!chatStore.isRetrying || chatStore.retrySessionLoaded)

  if (showLiveTab) {
    const fromProgress = chatStore.stageProgresses.filter(s => s.status !== 'pending')
    const existingProgressNames = new Set<string>()
    for (const s of fromProgress) {
      if (existingProgressNames.has(s.stageName)) continue
      existingProgressNames.add(s.stageName)
      if (INITIAL_STAGE_KEYS.includes(s.stageName) && coveredStageNames.has(s.stageName)) continue
      const liveKey = `${s.stageName}_live`
      if (usedKeys.has(liveKey)) continue
      usedKeys.add(liveKey)
      result.push({
        _key: liveKey,
        _label: STAGE_NAME_MAP[s.stageName] || s.stageName,
        stage: s.stage,
        stageName: s.stageName,
        status: s.status,
        duration: s.duration,
      })
    }

    for (const [name, filePath] of chatStore.stagePreviewMap) {
      if (!existingProgressNames.has(name) && filePath) {
        if (!usedKeys.has(name)) {
          usedKeys.add(name)
          result.push({
            _key: name,
            _label: STAGE_NAME_MAP[name] || name,
            stage: -1,
            stageName: name,
            status: 'success',
            duration: null,
          })
        }
      }
    }
  }

  return result
})

const hasStageContent = computed(() => {
  return chatStore.isStreaming || completedStages.value.length > 0 || chatStore.hasStepMessages || stageContentCache.value.size > 0
})

watch(hasStageContent, (val) => {
  emit('has-stage-content-change', val)
}, { immediate: true })

const stageContentCache = ref<Map<string, { type: 'markdown' | 'vue' | null; content: string | null; files: ApiFile[] | null }>>(new Map())
const stageLoadingMap = ref<Map<string, boolean>>(new Map())

let skipActiveStageKeyLoad = false

async function ensureStageContentLoaded(key: string) {
  if (stageContentCache.value.has(key)) return
  if (stageLoadingMap.value.get(key)) return

  const stage = completedStages.value.find(s => s._key === key)
  const stageName = stage?.stageName || key.replace(/_\d+$/, '').replace(/_live$/, '')
  if (!stageName) return

  let fetchPath: string | null = null

  const isDeduplicatedKey = /_\d+$/.test(key)

  const session = chatStore.currentSession
  if (session) {
    const outputs = session.messages.flatMap(m => m.stepMessages || [])
    if (isDeduplicatedKey) {
      const idx = parseInt(key.split('_').pop()!) - 1
      const sameNameOutputs = outputs.filter(o => o.stageName === stageName)
      const output = sameNameOutputs[idx]
      if (output) {
        fetchPath = output.filePath || null
      }
    } else {
      const output = [...outputs].reverse().find(o => o.stageName === stageName)
      if (output) {
        fetchPath = output.filePath || null
      }
    }
  }

  if (!fetchPath) {
    fetchPath = chatStore.stagePreviewMap.get(stageName) ?? null
  }

  if (!fetchPath) return

  const outputType = getStageOutputType(stageName)
  if (!outputType) return

  const wasStreaming = chatStore.isStreaming

  stageLoadingMap.value.set(key, true)
  try {
    if (outputType === 'markdown') {
      const content = await fetchStageFile(fetchPath)
      const stillValid = completedStages.value.some(s => s._key === key)
      if (stillValid) {
        stageContentCache.value.set(key, { type: 'markdown', content, files: null })
      } else if (key.endsWith('_live')) {
        const persisted = [...completedStages.value]
          .filter(s => s.stageName === stageName && !s._key.endsWith('_live'))
        if (persisted.length > 0) {
          const targetKey = persisted[persisted.length - 1]._key
          if (!stageContentCache.value.has(targetKey)) {
            stageContentCache.value.set(targetKey, { type: 'markdown', content, files: null })
          }
        }
      }
    } else if (outputType === 'vue') {
      const raw = await fetchStageJson<ApiFile[] | { data?: ApiFile[]; files?: ApiFile[] }>(fetchPath)
      const data = Array.isArray(raw) ? raw : (raw.data || raw.files || [])
      const stillValid = completedStages.value.some(s => s._key === key)
      if (stillValid) {
        stageContentCache.value.set(key, { type: 'vue', content: null, files: data })
      } else if (key.endsWith('_live')) {
        const persisted = [...completedStages.value]
          .filter(s => s.stageName === stageName && !s._key.endsWith('_live'))
        if (persisted.length > 0) {
          const targetKey = persisted[persisted.length - 1]._key
          if (!stageContentCache.value.has(targetKey)) {
            stageContentCache.value.set(targetKey, { type: 'vue', content: null, files: data })
          }
        }
      }
      if (wasStreaming || !stillValid) {
        projectStore.setFiles(apiFilesToProjectFiles(data, chatStore.currentSession?.componentLib))
        if (chatStore.currentSessionId) {
          chatStore.updateSessionFiles(chatStore.currentSessionId, filterUserFiles(data))
        }
      }
    }
  } catch {
    console.warn('Failed to load stage artifact for', key)
  } finally {
    stageLoadingMap.value.delete(key)
  }
}

watch(() => chatStore.activeStageTab, async (key) => {
  if (key !== null && hasStageContent.value) {
    let target = completedStages.value.find(s => s._key === key)
    if (!target) {
      target = completedStages.value.find(s => s.stageName === key && s._key.endsWith('_live'))
    }
    if (!target) {
      target = [...completedStages.value].reverse().find(s => s.stageName === key && !s._key.endsWith('_live'))
    }
    if (target) {
      skipActiveStageKeyLoad = true
      activeStageKey.value = target._key
      await ensureStageContentLoaded(target._key)
    }
  }
}, { flush: 'sync' })

watch(() => activeStageKey.value, async (key) => {
  if (key && !skipActiveStageKeyLoad) {
    await ensureStageContentLoaded(key)
  }
  skipActiveStageKeyLoad = false
})

watch(() => chatStore.stageProgresses.map(s => `${s.stageName}:${s.status}`).join(','), async () => {
  if (activeStageKey.value) {
    const key = activeStageKey.value
    if (!stageContentCache.value.has(key) && !stageLoadingMap.value.get(key)) {
      const stage = completedStages.value.find(s => s._key === key)
      if (stage) {
        const progress = chatStore.stageProgresses.find(s => s.stageName === stage.stageName)
        if (progress && progress.status !== 'running' && progress.status !== 'pending') {
          await ensureStageContentLoaded(key)
        }
      }
    }
  }

  if (chatStore.isStreaming) {
    for (const progress of chatStore.stageProgresses) {
      if (progress.status !== 'running' && progress.status !== 'pending'
          && chatStore.stagePreviewMap.has(progress.stageName)) {
        const liveKey = progress.stageName + '_live'
        if (!stageContentCache.value.has(liveKey) && !stageLoadingMap.value.get(liveKey)) {
          await ensureStageContentLoaded(liveKey)
        }
      }
    }
  }
})

function purgeStaleStageCache() {
  const validKeys = new Set(completedStages.value.map(s => s._key))
  for (const key of stageContentCache.value.keys()) {
    if (!validKeys.has(key)) {
      stageContentCache.value.delete(key)
    }
  }
}

watch(
  [() => chatStore.hasStepMessages, () => chatStore.isStreaming],
  async ([has, streaming], [prevHas, prevStreaming]) => {
    const shouldRun = (has && !prevHas) || (has && !streaming && prevStreaming === true)
    if (!shouldRun) return

    const knownKeys = new Set(stageContentCache.value.keys())
    const persistedStages = completedStages.value.filter(s => !s._key.endsWith('_live'))

    for (const [liveKey, cache] of stageContentCache.value) {
      if (liveKey.endsWith('_live')) {
        const stageName = liveKey.replace(/_live$/, '')
        const target = [...persistedStages].reverse().find(s => s.stageName === stageName)
        if (target && !stageContentCache.value.has(target._key)) {
          stageContentCache.value.set(target._key, cache)
        }
        stageContentCache.value.delete(liveKey)
      }
    }

    const resolveKey = activeStageKey.value || chatStore.activeStageTab

    if (resolveKey?.endsWith('_live')) {
      const stageName = resolveKey.replace(/_live$/, '')
      const newTab = [...persistedStages].reverse().find(s => s.stageName === stageName)
      if (newTab) {
        activeStageKey.value = newTab._key
        purgeStaleStageCache()
      }
    }

    if (resolveKey && !resolveKey.endsWith('_live')) {
      let target = completedStages.value.find(s => s._key === resolveKey)
      if (!target) {
        target = [...completedStages.value].reverse().find(s => s.stageName === resolveKey)
      }
      if (target) {
        activeStageKey.value = target._key
        purgeStaleStageCache()
      }
    }

    const newStages = persistedStages.filter(s => !knownKeys.has(s._key))
    for (const stage of newStages) {
      if (!stageContentCache.value.has(stage._key)) {
        await ensureStageContentLoaded(stage._key)
      }
    }
  },
)

watch(() => chatStore.retryInvalidatedStageNames, (names) => {
  if (names.length > 0) {
    for (const name of names) {
      for (const key of stageContentCache.value.keys()) {
        if (key === name || key.startsWith(name + '_')) {
          stageContentCache.value.delete(key)
        }
      }
    }
    chatStore.clearRetryInvalidatedStageNames()
  }
})

watch(() => chatStore.currentSessionId, () => {
  stageContentCache.value.clear()
  activeStageKey.value = ''
})

function getStageOutputType(stageName: string): 'markdown' | 'vue' | null {
  if (stageName === 'attachment' || stageName === 'requirement' || stageName === 'normalize_requirement') return 'markdown'
  if (stageName === 'generation' || stageName === 'optimization' || stageName === 'iteration'
    || stageName === 'generate_vue_code' || stageName === 'optimize_ux') return 'vue'
  return null
}

function getStageMarkdownContent(key: string): string | null {
  const cached = stageContentCache.value.get(key)
  if (cached?.type === 'markdown' && cached.content) {
    return cached.content
  }

  return null
}

function getStageVueFiles(key: string): ApiFile[] | null {
  const cached = stageContentCache.value.get(key)
  if (cached?.type === 'vue' && cached.files) {
    return cached.files
  }

  return null
}
</script>

<style scoped>
.stage-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.stage-tabs :deep(.el-tab-pane) {
  height: 100%;
}
</style>
