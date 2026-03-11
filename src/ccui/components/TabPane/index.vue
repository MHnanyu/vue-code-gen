<template>
  <el-tab-pane v-bind="$attrs" :closable="closable" :disabled="disabled" :label="label" :name="name" :lazy="lazy">
    <slot></slot>
  </el-tab-pane>
</template>

<script setup lang="ts">
interface Props {
  closable?: boolean
  disabled?: boolean
  label?: string
  name?: string | number
  lazy?: boolean
}

defineOptions({
  name: 'CcTabPane',
  inheritAttrs: false
})

withDefaults(defineProps<Props>(), {
  closable: false,
  disabled: false,
  label: '',
  name: '',
  lazy: false
})
</script>
