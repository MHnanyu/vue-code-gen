<template>
  <el-checkbox-button v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-checkbox-button>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcCheckboxButton',
  inheritAttrs: false
})

const slots = useSlots()
</script>
