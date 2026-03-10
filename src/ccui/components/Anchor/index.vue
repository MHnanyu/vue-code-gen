<template>
  <el-anchor v-bind="$attrs">
    <slot></slot>
  </el-anchor>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcAnchor',
  inheritAttrs: false
})
</script>

<style scoped>
.el-anchor {
  --el-anchor-bg: transparent;
}
</style>
