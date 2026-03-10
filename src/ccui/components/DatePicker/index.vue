<template>
  <el-date-picker v-bind="$attrs">
    <template v-if="slots.default" #default="scope">
      <slot v-bind="scope"></slot>
    </template>
    <template v-if="slots.rangeSeparator" #range-separator>
      <slot name="range-separator"></slot>
    </template>
  </el-date-picker>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcDatePicker',
  inheritAttrs: false
})

const slots = useSlots()
</script>
