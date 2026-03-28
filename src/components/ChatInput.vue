<template>
  <div class="px-4 py-4 border-t border-gray-200">
    <el-input
      :model-value="modelValue"
      type="textarea"
      :rows="3"
      :placeholder="placeholder"
      resize="none"
      @update:model-value="emit('update:modelValue', $event)"
      @keydown.enter.ctrl="emit('send')"
    />
    <div class="flex justify-between items-center mt-3">
      <span class="text-xs text-gray-400">Ctrl + Enter 发送</span>
      <el-button type="primary" :loading="loading" :disabled="!modelValue?.trim() || streaming" @click="emit('send')">
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  placeholder?: string
  loading?: boolean
  streaming?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'send': []
}>()
</script>
