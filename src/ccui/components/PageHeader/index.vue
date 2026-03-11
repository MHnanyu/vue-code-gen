<template>
  <el-page-header v-bind="$attrs" :title="title" :icon="icon" :content="content" :redirect="redirect">
    <template #header>
      <slot name="header"></slot>
    </template>
    <template #extra>
      <slot name="extra"></slot>
    </template>
    <template #content>
      <slot name="content"></slot>
    </template>
    <template #default>
      <slot></slot>
    </template>
    <template #breadcrumb>
      <slot name="breadcrumb"></slot>
    </template>
  </el-page-header>
</template>

<script setup lang="ts">
import type { VNode } from 'vue'

interface Props {
  title?: string | boolean
  icon?: VNode | string
  content?: string
  redirect?: string
}

defineOptions({
  name: 'CcPageHeader',
  inheritAttrs: false
})

withDefaults(defineProps<Props>(), {
  title: '返回',
  redirect: '',
  icon: ''
})
</script>
