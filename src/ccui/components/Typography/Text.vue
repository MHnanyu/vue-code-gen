<template>
  <el-text v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-text>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcTypographyText',
  inheritAttrs: false
})

const slots = useSlots()
</script>
