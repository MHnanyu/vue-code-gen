<template>
  <div class="py-1.5">
    <StageProgressToggle
      :collapsed="collapsed"
      :is-streaming="isStreaming"
      :has-failure="hasFailure"
      :has-cancelled="hasCancelled"
      :completed-count="completedCount"
      :total="stages.length"
      :failed-stage-names="failedStageNames"
      :cancelled-stage-names="cancelledStageNames"
      :total-duration="totalDuration"
      :cancel-fn="cancelFn"
      @toggle="collapsed = !collapsed"
    />
    <div v-show="!collapsed" class="flex flex-col">
      <StageProgressItem
        v-for="(stage, index) in stages"
        :key="stage.stage"
        :stage="stage"
        :index="index"
        :total="stages.length"
        :is-streaming="isStreaming"
        :retry-fn="retryFn"
        :prev-stage="index > 0 ? stages[index - 1] : undefined"
        @click="handleStageClick"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { StageProgressState } from '@/types'
import { STAGE_NAME_MAP } from '@/constants/stages'
import StageProgressToggle from '@/components/StageProgressToggle.vue'
import StageProgressItem from '@/components/StageProgressItem.vue'

const props = defineProps<{
  stages: StageProgressState[]
  isStreaming?: boolean
  retryFn?: (stage: number) => void
  cancelFn?: () => void
}>()

const emit = defineEmits<{
  'stage-click': [stage: StageProgressState]
}>()

const hasFailure = computed(() => props.stages.some(s => s.status === 'failed'))

const hasCancelled = computed(() => !hasFailure.value && props.stages.some(s => s.status === 'cancelled'))

const completedCount = computed(() =>
  props.stages.filter(s => s.status === 'success' || s.status === 'cached' || s.status === 'skipped').length,
)

const failedStageNames = computed(() =>
  props.stages.filter(s => s.status === 'failed').map(s => STAGE_NAME_MAP[s.stageName] || s.stageName),
)

const cancelledStageNames = computed(() =>
  props.stages.filter(s => s.status === 'cancelled').map(s => STAGE_NAME_MAP[s.stageName] || s.stageName),
)

const totalDuration = computed(() => {
  const durations = props.stages.filter(s => s.duration != null).map(s => s.duration as number)
  if (durations.length === 0) return ''
  const total = durations.reduce((a, b) => a + b, 0)
  return `${total.toFixed(1)}s`
})

const collapsed = ref(props.isStreaming ? false : !(hasFailure.value || hasCancelled.value))

watch(() => props.isStreaming, (val, oldVal) => {
  if (val) {
    collapsed.value = false
  } else if (oldVal === true) {
    collapsed.value = !(hasFailure.value || hasCancelled.value)
  }
})

watch(hasCancelled, (val) => {
  if (val) {
    collapsed.value = false
  }
})

watch(hasFailure, (val) => {
  if (val) {
    collapsed.value = false
  }
})

function handleStageClick(stage: StageProgressState) {
  emit('stage-click', stage)
}
</script>

