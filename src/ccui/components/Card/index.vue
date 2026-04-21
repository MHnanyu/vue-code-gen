<template>
  <el-card v-bind="$attrs">
    <template v-if="slots.header" #header>
      <slot name="header"></slot>
    </template>
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcCard',
  inheritAttrs: false
})

const slots = useSlots()
</script>
