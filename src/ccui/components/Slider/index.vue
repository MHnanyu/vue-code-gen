<template>
  <el-slider v-bind="$attrs">
    <template v-if="slots.default">
      <slot></slot>
    </template>
  </el-slider>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcSlider',
  inheritAttrs: false
})

const slots = useSlots()
</script>
