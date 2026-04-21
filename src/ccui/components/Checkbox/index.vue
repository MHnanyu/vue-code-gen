<template>
  <el-checkbox v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-checkbox>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcCheckbox',
  inheritAttrs: false
})

const slots = useSlots()
</script>
