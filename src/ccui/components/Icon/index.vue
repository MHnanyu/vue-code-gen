<template>
  <el-icon v-bind="$attrs">
    <component v-if="icon" :is="icon" />
    <slot></slot>
  </el-icon>
</template>

<script setup lang="ts">
import { ElIcon } from 'element-plus'

defineOptions({
  name: 'CcIcon',
  inheritAttrs: false
})

defineProps<{
  icon?: any
}>()
</script>
