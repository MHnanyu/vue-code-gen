<template>
  <div class="flex gap-3 mb-3 flex-row-reverse">
    <div class="flex-shrink-0">
      <el-avatar :size="32" style="background: #409eff">U</el-avatar>
    </div>
    <div class="max-w-[80%] flex flex-col items-end">
      <div class="px-4 py-3 rounded-xl leading-relaxed break-words bg-blue-500 text-white">
        <div v-if="message.attachments?.length" class="flex flex-wrap gap-2 mb-2 items-center">
          <template v-for="att in message.attachments" :key="att.id">
            <el-popover v-if="att.type === 'image'" placement="top" :width="300" trigger="hover">
              <template #reference>
                <img :src="`${API_BASE}${att.url}`" class="w-16 h-16 rounded-lg object-cover cursor-pointer border-2 border-white/30 shrink-0" />
              </template>
              <img :src="`${API_BASE}${att.url}`" class="w-full rounded" />
            </el-popover>
            <el-tooltip v-else :content="att.name" placement="top" :show-after="300">
              <div class="flex items-center gap-1 w-16 h-16 rounded-lg bg-blue-400 text-white text-xs shrink-0 flex-col justify-center cursor-default">
                <el-icon :size="20"><Document /></el-icon>
                <span class="w-full text-center truncate px-1">{{ att.name }}</span>
              </div>
            </el-tooltip>
          </template>
        </div>
        {{ message.content }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document } from '@element-plus/icons-vue'
import { API_BASE } from '@/api'
import type { ChatMessage } from '@/types'

defineProps<{
  message: ChatMessage
}>()
</script>
