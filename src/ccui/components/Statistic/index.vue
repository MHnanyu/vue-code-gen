<template>
  <el-statistic v-bind="$attrs">
    <template v-if="slots.title" #title>
      <slot name="title"></slot>
    </template>
    <template v-if="slots.prefix" #prefix>
      <slot name="prefix"></slot>
    </template>
    <template v-if="slots.suffix" #suffix>
      <slot name="suffix"></slot>
    </template>
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-statistic>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcStatistic',
  inheritAttrs: false
})

const slots = useSlots()
</script>
