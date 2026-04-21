<template>
  <el-tabs v-bind="$attrs" v-model="activeValue" :addable="addable" :before-leave="beforeLeave" :card="card" :editable="editable" :effect="effect" :expand-width="expandWidth" :lazy="lazy" :type="type" @tab-add="emit('tabAdd')" @tab-remove="emit('tabRemove', $event)" @update:model-value="handleModelValueChange">
    <slot></slot>
  </el-tabs>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue?: string | number
  addable?: boolean
  beforeLeave?: (newTabName: string | number, oldTabName: string | number) => void | boolean | Promise<void | boolean>
  card?: boolean
  editable?: boolean
  effect?: 'light' | 'dark'
  expandWidth?: number | string
  lazy?: boolean
  type?: 'card' | 'border-card' | ''
}

defineOptions({
  name: 'CcTabs',
  inheritAttrs: false
})

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  addable: false,
  beforeLeave: undefined,
  card: false,
  editable: false,
  effect: 'light',
  expandWidth: '',
  lazy: false,
  type: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  tabAdd: []
  tabRemove: [tabName: string | number]
}>()

const activeValue = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  activeValue.value = val
})

const handleModelValueChange = (val: string | number) => {
  emit('update:modelValue', val)
}
</script>
