<template>
  <el-text v-bind="$attrs" :tag="tag" :style="textStyle">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-text>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

defineOptions({
  name: 'CcTypographyTitle',
  inheritAttrs: false
})

interface Props {
  level?: 1 | 2 | 3 | 4 | 5
}

const props = withDefaults(defineProps<Props>(), {
  level: 1
})

const slots = useSlots()

const tag = computed(() => `h${props.level}` as any)
const textStyle = computed(() => {
  const sizes: Record<number, string> = {
    1: '32px',
    2: '28px',
    3: '24px',
    4: '20px',
    5: '16px'
  }
  return { fontSize: sizes[props.level], fontWeight: 'bold' }
})
</script>
