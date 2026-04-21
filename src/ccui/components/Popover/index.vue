<template>
  <el-popover v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
    <template v-if="slots.reference" #reference>
      <slot name="reference"></slot>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcPopover',
  inheritAttrs: false
})

const slots = useSlots()
</script>
