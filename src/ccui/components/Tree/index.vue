<template>
  <el-tree v-bind="$attrs">
    <template v-if="slots.default" #default="scope">
      <slot :="scope"></slot>
    </template>
    <template v-if="slots.node" #node="scope">
      <slot name="node" :="scope"></slot>
    </template>
    <template v-if="slots.empty" #empty>
      <slot name="empty"></slot>
    </template>
  </el-tree>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcTree',
  inheritAttrs: false
})

const slots = useSlots()
</script>
