<template>
  <el-input-tag v-bind="$attrs">
    <template v-if="slots.prefix" #prefix>
      <slot name="prefix"></slot>
    </template>
    <template v-if="slots.suffix" #suffix>
      <slot name="suffix"></slot>
    </template>
  </el-input-tag>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcInputTag',
  inheritAttrs: false
})

const slots = useSlots()
</script>
