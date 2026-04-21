<template>
  <el-color-picker v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-color-picker>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcColorPicker',
  inheritAttrs: false
})

const slots = useSlots()
</script>
