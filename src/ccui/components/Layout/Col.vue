<template>
  <el-col v-bind="$attrs">
    <slot></slot>
  </el-col>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcCol',
  inheritAttrs: false
})
</script>
