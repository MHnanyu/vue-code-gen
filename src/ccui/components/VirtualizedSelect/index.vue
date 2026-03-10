<template>
  <el-select-v2 v-bind="$attrs">
    <template #default v-if="$slots.default">
      <slot></slot>
    </template>
    <template #header v-if="$slots.header">
      <slot name="header"></slot>
    </template>
    <template #footer v-if="$slots.footer">
      <slot name="footer"></slot>
    </template>
    <template #empty v-if="$slots.empty">
      <slot name="empty"></slot>
    </template>
    <template #tag v-if="$slots.tag">
      <slot name="tag"></slot>
    </template>
    <template #loading v-if="$slots.loading">
      <slot name="loading"></slot>
    </template>
  </el-select-v2>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcVirtualizedSelect',
  inheritAttrs: false
})
</script>
