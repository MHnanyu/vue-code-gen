<template>
  <el-breadcrumb-item v-bind="$attrs">
    <slot></slot>
  </el-breadcrumb-item>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcBreadcrumbItem',
  inheritAttrs: false
})
</script>
