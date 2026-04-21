<template>
  <el-text v-bind="$attrs" tag="p">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-text>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcTypographyParagraph',
  inheritAttrs: false
})

const slots = useSlots()
</script>
