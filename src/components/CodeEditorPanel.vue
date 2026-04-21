<template>
  <div class="flex-1 flex overflow-hidden">
    <div class="w-[200px] shrink-0 border-r border-gray-200 overflow-y-auto">
      <FileTree
        :files="projectStore.files"
        :selected-file-id="projectStore.selectedFileId"
        @select="handleSelectFile"
        @add-file="handleAddFile"
        @delete="handleDeleteFile"
        @rename="handleRenameFile"
      />
    </div>
    <div class="editor-panel flex-1 flex flex-col overflow-hidden">
      <div v-if="selectedFile" class="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200 text-[13px]">
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
.editor-panel :deep(.monaco-editor-container) {
  flex: 1;
}
</style>
