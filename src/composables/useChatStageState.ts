import { ref, computed } from 'vue'
import { cancelGeneration as apiCancelGeneration } from '@/api'
import type { StageProgressState } from '@/types'

export function useChatStageState() {
  const isStreaming = ref(false)
  const isRetrying = ref(false)
  const retrySessionLoaded = ref(false)
  const currentTaskId = ref<string | null>(null)
  const stageProgresses = ref<StageProgressState[]>([])
  const stagePreviewMap = ref<Map<string, string | null>>(new Map())
  const activeStageTab = ref<string | null>(null)
  const retryInvalidatedStageNames = ref<string[]>([])

  const currentStreamingStage = computed(() => {
    return stageProgresses.value.find(s => s.status === 'running') ?? null
  })

  function resetStageProgresses(stageNames: string[]): void {
    stageProgresses.value = stageNames.map((name, index) => ({
      stage: index,
      stageName: name,
      status: 'pending' as const,
      duration: null,
    }))
  }

  function setStageProgresses(progresses: StageProgressState[]): void {
    stageProgresses.value = progresses
  }

  function updateStageStatus(
    stage: number,
    status: StageProgressState['status'],
    extra?: Partial<StageProgressState>,
  ): void {
    const item = stageProgresses.value.find(s => s.stage === stage)
    if (item) {
      item.status = status
      if (extra) {
        Object.assign(item, extra)
      }
    }
  }

  function setStagePreview(
    stageName: string,
    filePath: string | null,
  ): void {
    stagePreviewMap.value.set(stageName, filePath)
  }

  function cancelStreaming(): void {
    if (!currentTaskId.value || !isStreaming.value) return
    apiCancelGeneration(currentTaskId.value).catch((e) => {
      console.error('Cancel generation failed:', e)
    })
  }

  function setActiveStageTab(stageName: string | null, force = false): void {
    if (!force && activeStageTab.value === stageName && stageName !== null) {
      activeStageTab.value = null
      return
    }
    activeStageTab.value = stageName
  }

  function invalidateStageCache(stageNames: string[]): void {
    retryInvalidatedStageNames.value = stageNames
  }

  function clearRetryInvalidatedStageNames(): void {
    retryInvalidatedStageNames.value = []
  }

  return {
    isStreaming,
    isRetrying,
    retrySessionLoaded,
    currentTaskId,
    stageProgresses,
    stagePreviewMap,
    activeStageTab,
    retryInvalidatedStageNames,
    currentStreamingStage,
    resetStageProgresses,
    setStageProgresses,
    updateStageStatus,
    setStagePreview,
    cancelStreaming,
    setActiveStageTab,
    invalidateStageCache,
    clearRetryInvalidatedStageNames,
  }
}
