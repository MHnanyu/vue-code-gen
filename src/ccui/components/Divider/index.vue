<template>
  <el-divider v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-divider>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcDivider',
  inheritAttrs: false
})

const slots = useSlots()
</script>
