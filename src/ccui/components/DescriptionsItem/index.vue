<template>
  <el-descriptions-item v-bind="$attrs">
    <template v-if="slots.label" #label>
      <slot name="label"></slot>
    </template>
    <slot></slot>
  </el-descriptions-item>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcDescriptionsItem',
  inheritAttrs: false
})

const slots = useSlots()
</script>
