<template>
  <el-descriptions v-bind="$attrs">
    <template v-if="slots.title" #title>
      <slot name="title"></slot>
    </template>
    <template v-if="slots.extra" #extra>
      <slot name="extra"></slot>
    </template>
    <slot></slot>
  </el-descriptions>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcDescriptions',
  inheritAttrs: false
})

const slots = useSlots()
</script>
