<template>
  <el-space v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-space>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcSpace',
  inheritAttrs: false
})

const slots = useSlots()
</script>
