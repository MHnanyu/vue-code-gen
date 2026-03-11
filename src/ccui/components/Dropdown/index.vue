<template>
  <el-dropdown v-bind="$attrs">
    <slot></slot>
    <template #dropdown>
      <slot name="dropdown"></slot>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcDropdown',
  inheritAttrs: false
})
</script>
