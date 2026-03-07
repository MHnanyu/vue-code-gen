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
            :disabled="!isReplReady || activeTab !== 'preview'"
            @click="exportStaticHtml"
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
      
      <div v-if="activeTab === 'preview'" class="repl-wrapper preview flex-1">
        <div v-if="!isReplReady" class="preview-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载预览中...</span>
        </div>
        <Repl
          v-show="isReplReady"
          :store="replStore"
          :editor="Monaco"
          :preview-options="previewOptions"
          :show-compile-output="false"
          :show-import-map="false"
          :show-ts-config="false"
          :clear-console="false"
          layout="vertical"
        />
      </div>
      
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
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useDebounceFn } from '@vueuse/core'
import { Repl, useStore, useVueImportMap } from '@vue/repl'
import Monaco from '@vue/repl/monaco-editor'
import { useProjectStore } from '@/stores/project'
import { useChatStore } from '@/stores/chat'
import { updateSessionFiles, type ApiFile } from '@/api'
import { collectAllFiles } from '@/preview/resolver'
import { getBaseProjectFiles, TS_CONFIG, VITE_ENV_D_TS } from '@/templates/project-template'
import FileTree from '@/components/FileTree.vue'
import MonacoEditor from '@/components/MonacoEditor.vue'
import type { ProjectFile } from '@/types'
import JSZip from 'jszip'

const projectStore = useProjectStore()
const chatStore = useChatStore()
const activeTab = ref('preview')
const isSaving = ref(false)
const isReplReady = ref(false)
const hasFiles = computed(() => projectStore.files.length > 0)
const selectedFile = computed(() => projectStore.selectedFile)

const { importMap: vueImportMap } = useVueImportMap()

const replStore = useStore({
  builtinImportMap: computed(() => ({
    imports: {
      ...vueImportMap.value.imports,
      'element-plus': 'https://unpkg.com/element-plus@2.4.4/dist/index.full.mjs',
      '@element-plus/icons-vue': 'https://unpkg.com/@element-plus/icons-vue@2.3.1/dist/index.esm.js',
    },
  })),
})

const previewOptions = {
  headHTML: `
    <link rel="stylesheet" href="https://unpkg.com/element-plus@2.4.4/dist/index.css">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>
      blockquote {
        border-left: 4px solid #e5e7eb;
        padding-left: 1rem;
        margin: 1rem 0;
        color: #6b7280;
      }
    </style>
  `
}

const SUPPORTED_EXTS = /\.(vue|ts|tsx|js|jsx)$/

function normalizeImports(content: string, filename: string): string {
  let result = content

  if (filename === 'App.vue') {
    const scriptMatch = result.match(/(<script\s+setup[^>]*>)([\s\S]*?)(<\/script>)/)
    if (scriptMatch && !scriptMatch[2].includes('element-plus')) {
      const needsVueImports = []
      if (!scriptMatch[2].includes('getCurrentInstance')) needsVueImports.push('getCurrentInstance')
      
      const vueImport = needsVueImports.length > 0 
        ? `import { ${needsVueImports.join(', ')} } from 'vue'\n` 
        : ''
      
      const newScript = scriptMatch[1] + 
        `\n${vueImport}import ElementPlus from 'element-plus'\n` +
        `const instance = getCurrentInstance()\n` +
        `const app = instance?.appContext.app\n` +
        `if (app && !app._elementPlusRegistered) {\n` +
        `  app.use(ElementPlus)\n` +
        `  app._elementPlusRegistered = true\n` +
        `}\n` +
        scriptMatch[2] + 
        scriptMatch[3]
      result = result.replace(scriptMatch[0], newScript)
    }
  }

  result = result
    .replace(/^import\s+['"][^'"]+\.css['"]\s*;?\s*$/gm, '')
    .replace(/(['"])@\/(?:[^'"]*\/)?([^/'"]+)\1/g, '$1./$2$1')
    .replace(/(['"])\.\.?\/(?:[^'"]*\/)?([^/'"]+\.(vue|ts|tsx|js|jsx))\1/g, '$1./$2$1')

  return result
}

function syncFilesToRepl() {
  const allFiles = collectAllFiles(projectStore.files)
  if (allFiles.length === 0) {
    isReplReady.value = false
    return
  }

  const newFiles: Record<string, string> = {}
  for (const f of allFiles) {
    if (!f.content || !SUPPORTED_EXTS.test(f.name)) continue
    newFiles[f.name] = normalizeImports(f.content, f.name)
  }
  if (!newFiles['App.vue']) {
    isReplReady.value = false
    return
  }

  replStore.setFiles(newFiles, 'App.vue')
  isReplReady.value = true
}

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

function exportStaticHtml() {
  const replWrapper = document.querySelector('.repl-wrapper.preview')
  if (!replWrapper) {
    ElMessage.warning('预览区域未找到')
    return
  }
  
  const iframe = replWrapper.querySelector('iframe') as HTMLIFrameElement
  if (!iframe) {
    ElMessage.warning('预览 iframe 未找到')
    return
  }

  try {
    const innerDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!innerDoc) {
      ElMessage.warning('无法访问预览内容')
      return
    }

    const htmlContent = innerDoc.documentElement.outerHTML
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'exported-page.html'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('Export failed:', error)
    ElMessage.error('导出失败，可能是跨域限制')
  }
}

async function exportProject() {
  const zip = new JSZip()

  zip.file('package.json', getBaseProjectFiles().find(f => f.name === 'package.json')!.content)
  zip.file('vite.config.ts', getBaseProjectFiles().find(f => f.name === 'vite.config.ts')!.content)
  zip.file('tsconfig.json', TS_CONFIG)

  const indexHtml = getBaseProjectFiles().find(f => f.name === 'index.html')!.content
  zip.file('index.html', indexHtml)

  const srcFolder = zip.folder('src')
  if (!srcFolder) {
    ElMessage.error('创建 src 目录失败')
    return
  }

  srcFolder.file('main.ts', getBaseProjectFiles().find(f => f.name === 'main.ts')!.content)
  srcFolder.file('App.vue', getBaseProjectFiles().find(f => f.name === 'App.vue')!.content)
  srcFolder.file('style.css', getBaseProjectFiles().find(f => f.name === 'style.css')!.content)
  srcFolder.file('vite-env.d.ts', VITE_ENV_D_TS)

  const allFiles = collectAllFiles(projectStore.files)
  const userFiles = allFiles.filter(f => 
    f.type === 'file' && 
    !f.readonly && 
    f.content &&
    !['main.ts', 'App.vue', 'style.css', 'index.html', 'package.json', 'vite.config.ts'].includes(f.name)
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

const debouncedSync = useDebounceFn(syncFilesToRepl, 300)
watch(() => projectStore.files, debouncedSync, { deep: true, immediate: true })
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
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
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px;
}

.editor-panel :deep(.monaco-editor-container) {
  flex: 1;
}
</style>
