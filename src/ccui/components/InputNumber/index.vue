<template>
  <el-input-number v-bind="$attrs">
    <template v-if="slots.prefix" #prefix>
      <slot name="prefix"></slot>
    </template>
    <template v-if="slots.suffix" #suffix>
      <slot name="suffix"></slot>
    </template>
    <template v-if="slots.decrease" #decrease>
      <slot name="decrease"></slot>
    </template>
    <template v-if="slots.increase" #increase>
      <slot name="increase"></slot>
    </template>
  </el-input-number>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcInputNumber',
  inheritAttrs: false
})

const slots = useSlots()
</script>
