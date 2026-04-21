<template>
  <el-radio v-bind="$attrs">
    <template v-if="slots.default">
      <slot></slot>
    </template>
  </el-radio>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcRadio',
  inheritAttrs: false
})

const slots = useSlots()
</script>
