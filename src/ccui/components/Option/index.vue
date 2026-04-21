<template>
  <el-option v-bind="$attrs">
    <template v-if="slots.default">
      <slot></slot>
    </template>
  </el-option>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcOption',
  inheritAttrs: false
})

const slots = useSlots()
</script>
