<template>
  <el-table-column v-bind="$attrs">
    <template v-if="slots.header" #header="scope">
      <slot name="header" :column="scope.column" :$index="scope.$index"></slot>
    </template>
    <template v-if="slots.default" #default="scope">
      <slot :row="scope.row" :cell="scope.cell" :$index="scope.$index"></slot>
    </template>
  </el-table-column>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcTableColumn',
  inheritAttrs: false
})

const slots = useSlots()
</script>
