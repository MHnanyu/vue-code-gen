<template>
  <el-breadcrumb v-bind="$attrs" :separator="separator" :separator-icon="separatorIcon">
    <slot></slot>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  separator?: string
  separatorIcon?: Component | string
}

defineOptions({
  name: 'CcBreadcrumb',
  inheritAttrs: false
})

withDefaults(defineProps<Props>(), {
  separator: '/'
})
</script>
