<template>
  <el-mention v-bind="$attrs">
    <template v-if="slots.prefix" #prefix>
      <slot name="prefix"></slot>
    </template>
    <template v-if="slots.suffix" #suffix>
      <slot name="suffix"></slot>
    </template>
    <template v-if="slots.header" #header>
      <slot name="header"></slot>
    </template>
    <template v-if="slots.footer" #footer>
      <slot name="footer"></slot>
    </template>
    <template v-if="slots.loading" #loading>
      <slot name="loading"></slot>
    </template>
    <template v-if="slots.default" #default="{ item, index }">
      <slot name="default" :item="item" :index="index"></slot>
    </template>
  </el-mention>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcMention',
  inheritAttrs: false
})

const slots = useSlots()
</script>
