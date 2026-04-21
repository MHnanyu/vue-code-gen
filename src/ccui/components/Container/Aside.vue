<template>
  <el-aside v-bind="$attrs">
    <slot></slot>
  </el-aside>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcAside',
  inheritAttrs: false
})
</script>
