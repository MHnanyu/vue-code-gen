<template>
  <div class="code-editor-wrapper flex-1 flex">
    <div class="file-tree-panel">
      <FileTree
        :files="projectStore.files"
        :selected-file-id="projectStore.selectedFileId"
        @select="handleSelectFile"
        @add-file="handleAddFile"
        @delete="handleDeleteFile"
        @rename="handleRenameFile"
      />
    </div>
    <div class="editor-panel flex-1">
      <div v-if="selectedFile" class="editor-header">
        <span>{{ selectedFile.name }}</span>
        <el-tag v-if="selectedFile.readonly" size="small" type="info">只读</el-tag>
      </div>
      <MonacoEditor
        v-if="selectedFile"
        :value="selectedFile.content || ''"
        :language="selectedFile.language || 'typescript'"
        :readonly="selectedFile.readonly || false"
        @update:value="handleContentChange"
      />
      <el-empty v-else description="选择文件进行编辑" :image-size="60" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import FileTree from '@/components/FileTree.vue'
import MonacoEditor from '@/components/MonacoEditor.vue'
import type { ProjectFile } from '@/types'

const projectStore = useProjectStore()

const selectedFile = computed(() => projectStore.selectedFile)

function handleSelectFile(file: ProjectFile) {
  projectStore.selectFile(file.id)
}

function handleAddFile() {
  projectStore.addFile()
}

async function handleDeleteFile(file: ProjectFile) {
  try {
    await ElMessageBox.confirm(`确定删除文件 "${file.name}" 吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    projectStore.deleteFile(file.id)
    ElMessage.success('文件已删除')
  } catch {
  }
}

function handleRenameFile(file: ProjectFile, newName: string) {
  projectStore.renameFile(file.id, newName)
}

function handleContentChange(content: string) {
  if (selectedFile.value && !selectedFile.value.readonly) {
    projectStore.updateFileContent(selectedFile.value.id, content)
  }
}
</script>

<style scoped>
.code-editor-wrapper {
  overflow: hidden;
}

.file-tree-panel {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px;
}

.editor-panel :deep(.monaco-editor-container) {
  flex: 1;
}
</style>
