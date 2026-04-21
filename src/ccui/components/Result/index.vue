<template>
  <el-result v-bind="$attrs">
    <template v-if="slots.icon" #icon>
      <slot name="icon"></slot>
    </template>
    <template v-if="slots.title" #title>
      <slot name="title"></slot>
    </template>
    <template v-if="slots.subTitle" #subTitle>
      <slot name="subTitle"></slot>
    </template>
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-result>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcResult',
  inheritAttrs: false
})

const slots = useSlots()
</script>
