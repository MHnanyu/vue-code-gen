<template>
  <el-time-picker v-bind="$attrs">
    <template v-if="slots.default" #default="scope">
      <slot v-bind="scope"></slot>
    </template>
  </el-time-picker>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcTimePicker',
  inheritAttrs: false
})

const slots = useSlots()
</script>
