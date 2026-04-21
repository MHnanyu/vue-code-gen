<template>
  <el-collapse v-model="activeNames" v-bind="$attrs" @change="handleChange">
    <slot></slot>
  </el-collapse>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

defineOptions({
  name: 'CcCollapse',
  inheritAttrs: false
})

const props = defineProps<{
  modelValue?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'change': [value: string[]]
}>()

const activeNames = ref<string[]>(props.modelValue || [])

watch(() => props.modelValue, (val) => {
  activeNames.value = val || []
})

const handleChange = (val: string[]) => {
  emit('update:modelValue', val)
  emit('change', val)
}
</script>
