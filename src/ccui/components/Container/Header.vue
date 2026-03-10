<template>
  <el-header v-bind="$attrs">
    <slot></slot>
  </el-header>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcHeader',
  inheritAttrs: false
})
</script>
