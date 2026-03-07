<template>
  <div class="text-sm">
    <div class="tree-node" v-for="node in files" :key="node.id">
      <div
        class="flex items-center gap-2 p-2 cursor-pointer rounded transition-colors hover:bg-gray-50"
        :class="[
          node.id === selectedFileId ? 'bg-blue-50 text-blue-500' : '',
          node.type === 'folder' ? 'font-medium' : ''
        ]"
        :style="{ paddingLeft: `${depth * 16 + 8}px` }"
        @click="handleClick(node)"
      >
        <span class="flex items-center">
          <template v-if="node.type === 'folder'">
            <el-icon v-if="isExpanded(node.id)" color="#e6a23c"><FolderOpened /></el-icon>
            <el-icon v-else color="#e6a23c"><Folder /></el-icon>
          </template>
          <template v-else>
            <el-icon :color="getFileIconColor(node.language || '')"><Document /></el-icon>
          </template>
        </span>
        <span class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{{ node.name }}</span>
      </div>

      <div v-if="node.type === 'folder' && node.children && isExpanded(node.id)" class="tree-children">
        <FileTreeItem
          :files="node.children"
          :depth="depth + 1"
          :selected-file-id="selectedFileId"
          @select="$emit('select', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Folder, FolderOpened, Document } from '@element-plus/icons-vue'
import type { ProjectFile } from '@/types'

const props = withDefaults(defineProps<{
  files: ProjectFile[]
  depth?: number
  selectedFileId?: string | null
}>(), {
  depth: 0
})

const emit = defineEmits<{
  select: [file: ProjectFile]
}>()

const expandedIds = ref<Set<string>>(new Set())

function isExpanded(id: string): boolean {
  return expandedIds.value.has(id)
}

function handleClick(node: ProjectFile) {
  if (node.type === 'folder') {
    if (isExpanded(node.id)) {
      expandedIds.value.delete(node.id)
    } else {
      expandedIds.value.add(node.id)
    }
    // 强制更新
    expandedIds.value = new Set(expandedIds.value)
  } else {
    emit('select', node)
  }
}

function getFileIconColor(language: string): string {
  const colors: Record<string, string> = {
    vue: '#42b883',
    typescript: '#3178c6',
    javascript: '#f7df1e',
    html: '#e34c26',
    css: '#264de4',
    json: '#cbcb41'
  }
  return colors[language] || '#909399'
}
</script>

<script lang="ts">
export default {
  name: 'FileTreeItem'
}
</script>
