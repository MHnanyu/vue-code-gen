<template>
  <el-upload
    v-model:file-list="fileList"
    v-bind="$attrs"
    :class="['cc-upload', { 'cc-upload--disabled': disabled }]"
    :disabled="disabled"
    :before-upload="handleBeforeUpload"
    :before-remove="handleBeforeRemove"
    :on-change="handleChange"
    :on-success="handleSuccess"
    :on-error="handleError"
    :on-progress="handleProgress"
    :on-exceed="handleExceed"
  >
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
    <template v-if="slots.trigger" #trigger>
      <slot name="trigger"></slot>
    </template>
    <template v-if="slots.tip" #tip>
      <slot name="tip"></slot>
    </template>
    <template v-if="slots.file" #file="{ file }">
      <slot name="file" :file="file"></slot>
    </template>
  </el-upload>
</template>

<script setup lang="ts">
import { ref, useSlots, watch } from 'vue'
import type { UploadUserFile, UploadFile } from 'element-plus'

defineOptions({
  name: 'CcUpload',
  inheritAttrs: false
})

const props = defineProps<{
  modelValue?: UploadUserFile[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: UploadUserFile[]]
  'change': [file: UploadFile, files: UploadFile[]]
  'remove': [file: UploadFile]
  'success': [response: any, file: UploadFile]
  'error': [error: any, file: UploadFile]
  'progress': [event: ProgressEvent, file: UploadFile]
  'exceed': [files: File[], uploadFiles: UploadFile[]]
}>()

const slots = useSlots()

const fileList = ref<UploadUserFile[]>(props.modelValue || [])

watch(
  () => props.modelValue,
  (val) => {
    fileList.value = val || []
  }
)

watch(
  fileList,
  (val) => {
    emit('update:modelValue', val)
  },
  { deep: true }
)

const handleBeforeUpload = (uploadFile: UploadFile): boolean => {
  return true
}

const handleBeforeRemove = (file: UploadFile, _uploadFiles: UploadFile[]): boolean => {
  emit('remove', file)
  return true
}

const handleChange = (uploadFile: UploadFile, uploadFiles: UploadFile[]): void => {
  emit('change', uploadFile, uploadFiles)
}

const handleSuccess = (response: any, uploadFile: UploadFile): void => {
  emit('success', response, uploadFile)
}

const handleError = (error: any, uploadFile: UploadFile): void => {
  emit('error', error, uploadFile)
}

const handleProgress = (event: ProgressEvent, uploadFile: UploadFile): void => {
  emit('progress', event, uploadFile)
}

const handleExceed = (files: File[], uploadFiles: UploadFile[]): void => {
  emit('exceed', files, uploadFiles)
}
</script>

<style scoped>
.cc-upload--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
