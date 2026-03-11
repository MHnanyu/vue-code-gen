<template>
  <el-step v-bind="$attrs" :title="title" :description="description" :icon="icon" :status="status">
    <slot></slot>
  </el-step>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  title?: string
  description?: string
  icon?: Component | string
  status?: 'wait' | 'process' | 'finish' | 'error' | 'success'
}

defineOptions({
  name: 'CcStep',
  inheritAttrs: false
})

withDefaults(defineProps<Props>(), {
  title: '',
  description: ''
})
</script>
