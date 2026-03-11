<template>
  <el-menu v-bind="$attrs">
    <slot></slot>
  </el-menu>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcMenu',
  inheritAttrs: false
})
</script>
