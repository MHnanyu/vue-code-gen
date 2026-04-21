<template>
  <el-main v-bind="$attrs">
    <slot></slot>
  </el-main>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcMain',
  inheritAttrs: false
})
</script>
