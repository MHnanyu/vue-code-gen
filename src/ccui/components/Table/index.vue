<template>
  <el-table v-bind="$attrs">
    <template v-if="slots.default" #default="scope">
      <slot :row="scope.row" :$index="scope.$index"></slot>
    </template>
    <template v-if="slots.append" #append>
      <slot name="append"></slot>
    </template>
    <template v-if="slots.empty" #empty>
      <slot name="empty"></slot>
    </template>
    <template v-if="slots.header" #header="scope">
      <slot name="header" :column="scope.column" :$index="scope.$index"></slot>
    </template>
  </el-table>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcTable',
  inheritAttrs: false
})

const slots = useSlots()
</script>
