<template>
  <el-drawer v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
    <template v-if="slots.title" #title>
      <slot name="title"></slot>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcDrawer',
  inheritAttrs: false
})

const slots = useSlots()
</script>
