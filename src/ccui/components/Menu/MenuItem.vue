<template>
  <el-menu-item v-bind="$attrs">
    <slot></slot>
  </el-menu-item>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcMenuItem',
  inheritAttrs: false
})
</script>
