<template>
  <el-tooltip v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
    <template v-if="slots.content" #content>
      <slot name="content"></slot>
    </template>
  </el-tooltip>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcTooltip',
  inheritAttrs: false
})

const slots = useSlots()
</script>
