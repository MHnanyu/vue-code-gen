<template>
  <el-time-select v-bind="$attrs">
    <template v-if="slots.default" #default="scope">
      <slot v-bind="scope"></slot>
    </template>
  </el-time-select>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcTimeSelect',
  inheritAttrs: false
})

const slots = useSlots()
</script>
