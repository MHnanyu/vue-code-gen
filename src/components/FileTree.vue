<template>
  <div class="file-tree">
    <div class="tree-node" v-for="node in files" :key="node.id">
      <div
        class="node-item"
        :class="{ active: node.id === selectedFileId, folder: node.type === 'folder' }"
        :style="{ paddingLeft: `${depth * 16 + 8}px` }"
        @click="handleClick(node)"
      >
        <span class="node-icon">
          <template v-if="node.type === 'folder'">
            <el-icon v-if="isExpanded(node.id)" color="#e6a23c"><FolderOpened /></el-icon>
            <el-icon v-else color="#e6a23c"><Folder /></el-icon>
          </template>
          <template v-else>
            <el-icon :color="getFileIconColor(node.language || '')"><Document /></el-icon>
          </template>
        </span>
        <span class="node-name">{{ node.name }}</span>
      </div>

      <!-- 子节点 -->
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
// 递归组件需要单独定义name
export default {
  name: 'FileTreeItem'
}
</script>

<style scoped>
.file-tree {
  font-size: 14px;
}

.node-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.node-item:hover {
  background: #f5f7fa;
}

.node-item.active {
  background: #ecf5ff;
  color: #409eff;
}

.node-item.folder {
  font-weight: 500;
}

.node-icon {
  display: flex;
  align-items: center;
}

.node-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-children {
  /* 子节点样式 */
}
</style>
