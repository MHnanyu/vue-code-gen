<template>
  <el-cascader v-bind="$attrs">
    <template v-if="slots.default" #default="{ node, data }">
      <slot :node="node" :data="data"></slot>
    </template>
    <template v-if="slots.empty" #empty>
      <slot name="empty"></slot>
    </template>
  </el-cascader>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcCascader',
  inheritAttrs: false
})

const slots = useSlots()
</script>
