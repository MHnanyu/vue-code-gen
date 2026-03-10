<template>
  <el-form-item v-bind="$attrs">
    <slot></slot>
  </el-form-item>
</template>

<script setup lang="ts">
defineOptions({
  name: 'CcFormItem'
})
</script>
