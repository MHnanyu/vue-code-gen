<template>
  <el-tag v-bind="$attrs" :closable="closable" :disable-transitions="false" :hit="hit" :color="color" :size="size" :type="type" :effect="effect" :round="round" @close="handleClose">
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
  </el-tag>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcTag',
  inheritAttrs: false
})

interface Props {
  closable?: boolean
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | ''
  hit?: boolean
  color?: string
  size?: 'large' | 'default' | 'small'
  effect?: 'light' | 'dark' | 'plain'
  round?: boolean
}

withDefaults(defineProps<Props>(), {
  closable: false,
  type: '',
  hit: false,
  effect: 'light',
  round: false
})

const emit = defineEmits<{
  close: [event: Event]
}>()

const slots = useSlots()

const handleClose = (event: Event) => {
  emit('close', event)
}
</script>
