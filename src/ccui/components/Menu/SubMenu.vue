<template>
  <el-sub-menu v-bind="$attrs">
    <slot></slot>
  </el-sub-menu>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcSubMenu',
  inheritAttrs: false
})
</script>
