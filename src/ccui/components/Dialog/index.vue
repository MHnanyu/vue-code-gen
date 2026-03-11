<template>
  <el-dialog v-bind="$attrs">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
    <template v-if="slots.title" #title>
      <slot name="title"></slot>
    </template>
    <template v-if="slots.footer" #footer>
      <slot name="footer"></slot>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcDialog',
  inheritAttrs: false
})

const slots = useSlots()
</script>
