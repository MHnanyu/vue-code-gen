<template>
  <el-popconfirm v-bind="$attrs" @confirm="$emit('confirm')" @cancel="$emit('cancel')">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
    <template v-if="slots.reference" #reference>
      <slot name="reference"></slot>
    </template>
  </el-popconfirm>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcPopconfirm',
  inheritAttrs: false
})

defineEmits(['confirm', 'cancel'])

const slots = useSlots()
</script>
