<template>
  <el-footer v-bind="$attrs">
    <slot></slot>
  </el-footer>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcFooter',
  inheritAttrs: false
})
</script>
