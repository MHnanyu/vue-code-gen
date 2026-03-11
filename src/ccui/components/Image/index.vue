<template>
  <el-image
    v-bind="$attrs"
    :src="src"
    :fit="fit"
    :width="width"
    :height="height"
    :preview-src-list="previewSrcList"
    :preview-teleported="previewTeleported"
  >
    <template v-if="slots.error" #error>
      <slot name="error"></slot>
    </template>
    <template v-if="slots.preview" #preview>
      <slot name="preview"></slot>
    </template>
  </el-image>
</template>

<script setup lang="ts">
import { useSlots } from 'vue'

defineOptions({
  name: 'CcImage',
  inheritAttrs: false
})

defineProps<{
  src?: string
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  width?: number | string
  height?: number | string
  previewSrcList?: string[]
  previewTeleported?: boolean
}>()

const slots = useSlots()
</script>
