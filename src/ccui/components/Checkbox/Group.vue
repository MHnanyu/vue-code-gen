<template>
  <el-checkbox-group v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-checkbox-group>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcCheckboxGroup',
  inheritAttrs: false
})

const slots = useSlots()
</script>
