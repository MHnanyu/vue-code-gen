<template>
  <div class="text-sm">
    <div class="file-section">
      <div class="section-header">
        <span class="font-medium text-gray-700">用户文件</span>
        <el-button size="small" type="primary" link @click="$emit('add-file')">
          <el-icon><Plus /></el-icon> 新增
        </el-button>
      </div>
      <div v-if="editableFiles.length > 0">
        <div class="tree-node" v-for="node in editableFiles" :key="node.id">
          <FileTreeItem
            :node="node"
            :depth="0"
            :selected-file-id="selectedFileId"
            :default-expanded-ids="editableFolderIds"
            @select="$emit('select', $event)"
            @delete="$emit('delete', $event)"
            @rename="$emit('rename', $event)"
          />
        </div>
      </div>
      <div v-else class="text-gray-400 text-xs p-2">暂无用户文件</div>
    </div>

    <div class="file-section readonly-section">
      <div class="section-header">
        <span class="font-medium text-gray-500">系统文件（只读）</span>
      </div>
      <div v-if="readonlyFiles.length > 0">
        <div class="tree-node" v-for="node in readonlyFiles" :key="node.id">
          <FileTreeItem
            :node="node"
            :depth="0"
            :selected-file-id="selectedFileId"
            :is-readonly="true"
            @select="$emit('select', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { ProjectFile } from '@/types'
import FileTreeItem from './FileTreeItem.vue'

const props = defineProps<{
  files: ProjectFile[]
  selectedFileId?: string | null
}>()

defineEmits<{
  select: [file: ProjectFile]
  'add-file': []
  delete: [file: ProjectFile]
  rename: [file: ProjectFile, newName: string]
}>()

const editableFiles = computed(() => {
  return filterFiles(props.files, false)
})

const readonlyFiles = computed(() => {
  return filterFiles(props.files, true)
})

const editableFolderIds = computed(() => {
  return collectFolderIds(editableFiles.value)
})

function collectFolderIds(files: ProjectFile[]): string[] {
  const ids: string[] = []
  for (const f of files) {
    if (f.type === 'folder') {
      ids.push(f.id)
      if (f.children) {
        ids.push(...collectFolderIds(f.children))
      }
    }
  }
  return ids
}

function filterFiles(fileList: ProjectFile[], readonly: boolean): ProjectFile[] {
  const result: ProjectFile[] = []
  
  for (const f of fileList) {
    if (f.type === 'file') {
      if (!!f.readonly === readonly) {
        result.push(f)
      }
    } else if (f.type === 'folder' && f.children) {
      const filteredChildren = filterFiles(f.children, readonly)
      if (filteredChildren.length > 0) {
        result.push({
          ...f,
          readonly,
          children: filteredChildren
        })
      }
    }
  }
  
  return result
}
</script>

<style scoped>
.file-section {
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px 4px;
  border-bottom: 1px solid #f0f0f0;
}

.readonly-section .section-header {
  background: #fafafa;
}
</style>
