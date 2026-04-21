<template>
  <div v-if="thinkingContent" class="mb-2">
    <div class="px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words max-w-[80%]">
      {{ thinkingContent }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  thinkingContent: string
}>()
</script>
