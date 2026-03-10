<template>
  <div v-bind="$attrs">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcTypography',
  inheritAttrs: false
})
</script>
