<template>
  <el-switch v-bind="$attrs">
    <template v-if="slots.indicator">
      <slot name="indicator"></slot>
    </template>
  </el-switch>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcSwitch',
  inheritAttrs: false
})

const slots = useSlots()
</script>
