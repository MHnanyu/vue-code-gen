<template>
  <el-option-group v-bind="$attrs">
    <slot></slot>
  </el-option-group>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcOptionGroup',
  inheritAttrs: false
})
</script>
