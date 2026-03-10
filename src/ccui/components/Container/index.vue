<template>
  <el-container v-bind="$attrs" :direction="computedDirection">
    <slot></slot>
  </el-container>
</template>

<script setup lang="ts">
import { useSlots, computed } from 'vue'

defineOptions({
  name: 'CcContainer',
  inheritAttrs: false
})

const props = defineProps<{
  direction?: 'horizontal' | 'vertical'
}>()

const slots = useSlots()

const computedDirection = computed(() => {
  if (props.direction) {
    return props.direction
  }
  const children = slots.default?.() || []
  const hasHeaderOrFooter = children.some((child: any) => {
    const name = child.type?.name || child.type?.__name
    return name === 'CcHeader' || name === 'CcFooter'
  })
  return hasHeaderOrFooter ? 'vertical' : 'horizontal'
})
</script>
