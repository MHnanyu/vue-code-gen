<template>
  <el-steps v-bind="$attrs" :active="active" :align-center="alignCenter" :active-color="activeColor" :finish-status="finishStatus" :hidden="hidden" :inline="inline" :space="space" :direction="direction" :percentage="percentage" :progress-offset="progressOffset" :simple="simple" :transition-name="transitionName">
    <slot></slot>
  </el-steps>
</template>

<script setup lang="ts">
interface Props {
  active?: number
  alignCenter?: boolean
  activeColor?: string
  finishStatus?: 'wait' | 'process' | 'finish' | 'error' | 'success'
  hidden?: boolean
  inline?: boolean
  space?: number | string
  direction?: 'vertical' | 'horizontal'
  percentage?: number
  progressOffset?: number
  simple?: boolean
  transitionName?: string
}

defineOptions({
  name: 'CcSteps',
  inheritAttrs: false
})

withDefaults(defineProps<Props>(), {
  active: 0,
  alignCenter: false,
  activeColor: '',
  finishStatus: 'finish',
  hidden: false,
  inline: false,
  space: '',
  direction: 'horizontal',
  percentage: 0,
  progressOffset: 0,
  simple: false,
  transitionName: ''
})
</script>
