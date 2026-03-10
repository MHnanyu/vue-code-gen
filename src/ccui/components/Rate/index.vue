<template>
  <el-rate v-bind="$attrs">
    <template v-if="slots.default">
      <slot></slot>
    </template>
  </el-rate>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcRate',
  inheritAttrs: false
})

const slots = useSlots()
</script>
