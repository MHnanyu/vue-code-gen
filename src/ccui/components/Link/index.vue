<template>
  <el-link v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
    <template v-if="slots.icon" #icon>
      <slot name="icon"></slot>
    </template>
  </el-link>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcLink',
  inheritAttrs: false
})

const slots = useSlots()
</script>
