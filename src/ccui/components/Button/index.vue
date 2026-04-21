<template>
  <el-button v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
    <template v-if="slots.icon" #icon>
      <slot name="icon"></slot>
    </template>
    <template v-if="slots.loading" #loading>
      <slot name="loading"></slot>
    </template>
  </el-button>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcButton',
  inheritAttrs: false
})

const slots = useSlots()
</script>
