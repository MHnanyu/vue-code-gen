<template>
  <el-avatar v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-avatar>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcAvatar',
  inheritAttrs: false
})

const slots = useSlots()
</script>
