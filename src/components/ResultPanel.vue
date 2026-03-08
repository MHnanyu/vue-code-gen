<template>
  <div class="h-full flex flex-col bg-white">
    <div v-if="!hasFiles" class="flex-1 flex items-center justify-center">
      <el-empty description="生成代码后显示预览" :image-size="80">
        <template #image>
          <span class="text-5xl">🎨</span>
        </template>
      </el-empty>
    </div>
    <template v-else>
      <div class="toolbar">
        <el-tabs v-model="activeTab" class="result-tabs">
          <el-tab-pane label="Preview" name="preview" />
          <el-tab-pane label="Code" name="code" />
        </el-tabs>
        <div class="toolbar-actions">
          <el-tooltip content="全屏预览" placement="top">
            <el-button
              :disabled="!hasFiles"
              @click="goToFullscreenPreview"
            >
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-tooltip>
          <el-button
            type="success"
            :loading="isSaving"
            :disabled="!projectStore.isModified"
            @click="handleSave"
          >
            保存并同步
          </el-button>
          <el-button
            type="primary"
            :disabled="!replPreviewRef?.isReplReady || activeTab !== 'preview'"
            @click="replPreviewRef?.exportStaticHtml()"
          >
            导出 HTML
          </el-button>
          <el-button
            type="warning"
            :disabled="!hasFiles"
            @click="exportProject"
          >
            导出项目
          </el-button>
        </div>
      </div>
      
      <VueReplPreview
        v-if="activeTab === 'preview'"
        ref="replPreviewRef"
        class="flex-1"
        :files="projectStore.files"
        :show-toolbar="false"
        empty-text="生成代码后显示预览"
        empty-icon="🎨"
        loading-text="加载预览中..."
      />
      
      <div v-else class="code-editor-wrapper flex-1 flex">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FullScreen } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import { useChatStore } from '@/stores/chat'
import { updateSessionFiles, type ApiFile } from '@/api'
import { collectAllFiles } from '@/preview/resolver'
import { getBaseProjectFiles } from '@/templates/project-template'
import FileTree from '@/components/FileTree.vue'
import MonacoEditor from '@/components/MonacoEditor.vue'
import VueReplPreview from '@/components/VueReplPreview.vue'
import type { ProjectFile } from '@/types'
import JSZip from 'jszip'

const router = useRouter()
const projectStore = useProjectStore()
const chatStore = useChatStore()
const activeTab = ref('preview')
const isSaving = ref(false)
const replPreviewRef = ref<InstanceType<typeof VueReplPreview> | null>(null)
const hasFiles = computed(() => projectStore.files.length > 0)
const selectedFile = computed(() => projectStore.selectedFile)

function collectEditableApiFiles(): ApiFile[] {
  const result: ApiFile[] = []

  function collect(files: ProjectFile[]) {
    for (const f of files) {
      if (f.type === 'file' && !f.readonly) {
        result.push({
          id: f.id,
          name: f.name,
          path: f.path,
          type: f.type,
          language: f.language,
          content: f.content,
        })
      }
      if (f.children) {
        collect(f.children)
      }
    }
  }

  collect(projectStore.files)
  return result
}

async function handleSave() {
  const sessionId = chatStore.currentSessionId
  if (!sessionId) {
    ElMessage.warning('没有活动的会话')
    return
  }

  isSaving.value = true
  try {
    const filesToSave = collectEditableApiFiles()
    await updateSessionFiles(sessionId, filesToSave)
    projectStore.clearModified()
    chatStore.updateSessionFiles(sessionId, filesToSave)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('Failed to save files:', error)
    ElMessage.error('保存失败')
  } finally {
    isSaving.value = false
  }
}

function goToFullscreenPreview() {
  const sessionId = chatStore.currentSessionId
  if (sessionId) {
    router.push({ path: '/preview', query: { sessionId } })
  }
}

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
    // 用户取消
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

async function exportProject() {
  const zip = new JSZip()
  const baseFiles = getBaseProjectFiles()

  const findFile = (name: string) => baseFiles.find(f => f.name === name)!

  zip.file('package.json', findFile('package.json').content)
  zip.file('vite.config.ts', findFile('vite.config.ts').content)
  zip.file('tsconfig.json', findFile('tsconfig.json').content)
  zip.file('index.html', findFile('index.html').content)

  const srcFolder = zip.folder('src')
  if (!srcFolder) {
    ElMessage.error('创建 src 目录失败')
    return
  }

  srcFolder.file('main.ts', findFile('main.ts').content)
  srcFolder.file('App.vue', findFile('App.vue').content)
  srcFolder.file('style.css', findFile('style.css').content)
  srcFolder.file('vite-env.d.ts', findFile('vite-env.d.ts').content)

  const allFiles = collectAllFiles(projectStore.files)
  const baseFileNames = baseFiles.map(f => f.name)
  const userFiles = allFiles.filter(f => 
    f.type === 'file' && 
    !f.readonly && 
    f.content &&
    !baseFileNames.includes(f.name)
  )

  for (const file of userFiles) {
    const filePath = file.path.startsWith('/') ? file.path.slice(1) : file.path
    if (filePath.startsWith('src/')) {
      srcFolder.file(filePath.replace('src/', ''), file.content!)
    } else {
      zip.file(filePath, file.content!)
    }
  }

  try {
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vue-project.zip'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('项目导出成功')
  } catch (error) {
    console.error('Export project failed:', error)
    ElMessage.error('导出项目失败')
  }
}
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.result-tabs {
  flex: 1;
}

.result-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 16px;
  border-bottom: none;
  background: transparent;
}

.result-tabs :deep(.el-tabs__content) {
  display: none;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  padding: 0 16px;
}

.repl-wrapper {
  overflow: hidden;
  position: relative;
}

.preview-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #fff;
  z-index: 10;
  color: #909399;
  font-size: 14px;
}

.preview-loading .el-icon {
  font-size: 24px;
}

.repl-wrapper.preview :deep(.split-pane > .left),
.repl-wrapper.preview :deep(.split-pane > .dragger) {
  display: none !important;
}

.repl-wrapper.preview :deep(.split-pane > .right) {
  width: 100% !important;
  height: 100% !important;
}

.repl-wrapper.preview :deep(.output-tabs),
.repl-wrapper.preview :deep(.tab-buttons) {
  display: none !important;
}

.repl-wrapper.preview :deep(.output-container) {
  height: 100% !important;
}

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
