<template>
  <el-scrollbar v-bind="$attrs" ref="scrollbarRef">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { useSlots, ref } from 'vue'

defineOptions({
  name: 'CcScrollbar',
  inheritAttrs: false
})

const slots = useSlots()
const scrollbarRef = ref()

const setScrollTop = (value: number) => {
  scrollbarRef.value?.setScrollTop(value)
}

const setScrollLeft = (value: number) => {
  scrollbarRef.value?.setScrollLeft(value)
}

const scrollTo = (options: ScrollToOptions | number, yCoord?: number) => {
  scrollbarRef.value?.scrollTo(options, yCoord)
}

defineExpose({
  setScrollTop,
  setScrollLeft,
  scrollTo,
  scrollbarRef
})
</script>
