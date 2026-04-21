<template>
  <el-collapse-item v-bind="$attrs" :title="title" :name="name">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
    <template v-if="slots.title" #title>
      <slot name="title"></slot>
    </template>
    <template v-if="slots.extra" #extra>
      <slot name="extra"></slot>
    </template>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcCollapseItem',
  inheritAttrs: false
})

defineProps<{
  title?: string
  name?: string
}>()

const slots = useSlots()
</script>
