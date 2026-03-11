<template>
  <el-menu-item-group v-bind="$attrs">
    <template #title>
      <slot name="title"></slot>
    </template>
    <slot></slot>
  </el-menu-item-group>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcMenuItemGroup',
  inheritAttrs: false
})
</script>
