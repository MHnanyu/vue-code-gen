<template>
  <el-backtop v-bind="$attrs" @click="$emit('click', $event)">
    <slot></slot>
  </el-backtop>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcBacktop',
  inheritAttrs: false
})

defineEmits(['click'])
</script>
