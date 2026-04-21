<template>
  <el-affix v-bind="$attrs">
    <slot></slot>
  </el-affix>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcAffix',
  inheritAttrs: false
})
</script>
