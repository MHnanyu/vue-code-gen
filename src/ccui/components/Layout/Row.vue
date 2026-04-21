<template>
  <el-row v-bind="$attrs">
    <slot></slot>
  </el-row>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcRow',
  inheritAttrs: false
})
</script>
