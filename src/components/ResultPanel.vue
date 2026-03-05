<template>
  <div class="result-panel">
    <div class="result-header">
      <el-button type="primary" :icon="RefreshRight" @click="handleRefresh" :disabled="!hasContent || isPreviewLoading">
        <span v-if="isPreviewLoading">编译中...</span>
        <span v-else>刷新预览</span>
      </el-button>
      <el-tag v-if="isModified" type="warning" size="small">代码已修改</el-tag>
      <el-tag v-if="previewError" type="danger" size="small">预览错误</el-tag>

      <!-- 预览模式切换 -->
      <el-radio-group v-model="previewMode" size="small" style="margin-left: auto">
        <el-radio-button value="browser">浏览器编译</el-radio-button>
        <el-radio-button value="webcontainer">WebContainer</el-radio-button>
      </el-radio-group>
    </div>

    <el-tabs v-model="activeTab" class="result-tabs">
      <el-tab-pane label="Preview" name="preview">
        <div class="preview-container">
          <!-- WebContainer 预览模式 -->
          <WebContainerPreview
            v-if="previewMode === 'webcontainer'"
            ref="webcontainerPreviewRef"
            :page-content="pageContent"
            template="element-plus"
          />

          <!-- 浏览器编译预览模式（原有逻辑） -->
          <template v-else>
            <!-- 错误提示 -->
            <div v-if="previewError" class="error-overlay">
              <el-alert type="error" :closable="false" show-icon>
                <template #title>编译错误</template>
                <pre>{{ previewError }}</pre>
              </el-alert>
            </div>

            <!-- 加载状态 -->
            <div v-else-if="isPreviewLoading && !previewHtml" class="loading-overlay">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <span>正在编译预览...</span>
            </div>

            <!-- 预览 iframe -->
            <div v-else-if="previewHtml" class="preview-frame">
              <iframe
                ref="previewIframe"
                :key="iframeKey"
                :srcdoc="previewHtml"
                sandbox="allow-scripts allow-same-origin"
                @load="handleIframeLoad"
              ></iframe>
            </div>

            <!-- 空状态 -->
            <el-empty v-else description="生成代码后显示预览" :image-size="80">
              <template #image>
                <span style="font-size: 48px">🎨</span>
              </template>
            </el-empty>
          </template>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Code" name="code">
        <div class="code-container">
          <div class="code-sidebar" v-if="files.length > 0">
            <div class="sidebar-header">
              <span>项目文件</span>
              <el-tag size="small" type="info">{{ fileCount }} 文件</el-tag>
            </div>
            <div class="file-list">
              <FileTreeItem
                :files="files"
                :selected-file-id="selectedFileId"
                @select="handleSelectFile"
              />
            </div>
          </div>

          <div class="code-editor" v-if="selectedFile">
            <div class="editor-header">
              <span class="file-path">{{ selectedFile.path }}</span>
              <el-button text size="small" @click="copyCode">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
            </div>
            <div class="editor-content">
              <MonacoEditor
                :value="selectedFile.content || ''"
                :language="selectedFile.language || 'plaintext'"
                @update:value="handleContentChange"
              />
            </div>
          </div>

          <el-empty v-else description="选择文件查看内容" :image-size="80">
            <template #image>
              <span style="font-size: 48px">📄</span>
            </template>
          </el-empty>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, RefreshRight, Loading } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import { useWebContainerStore } from '@/stores/webcontainer'
import MonacoEditor from '@/components/MonacoEditor.vue'
import FileTreeItem from '@/components/FileTree.vue'
import WebContainerPreview from '@/components/WebContainerPreview.vue'
import type { ProjectFile } from '@/types'

const projectStore = useProjectStore()
const webcontainerStore = useWebContainerStore()

const activeTab = ref('preview')
const previewMode = ref<'browser' | 'webcontainer'>('browser')
const iframeKey = ref(0)
const previewIframe = ref<HTMLIFrameElement | null>(null)
const webcontainerPreviewRef = ref<InstanceType<typeof WebContainerPreview> | null>(null)

const files = computed(() => projectStore.files)
const selectedFileId = computed(() => projectStore.selectedFileId)
const selectedFile = computed(() => projectStore.selectedFile)
const previewHtml = computed(() => projectStore.previewHtml)
const isPreviewLoading = computed(() => projectStore.isPreviewLoading)
const previewError = computed(() => projectStore.previewError)
const isModified = computed(() => projectStore.isModified)

// 获取 Page.vue 内容
const pageContent = computed(() => {
  const pageFile = findFileByPath(files.value, '/src/Page.vue')
  return pageFile?.content || ''
})

const hasContent = computed(() => {
  return pageContent.value.length > 0 || previewHtml.value.length > 0
})

const fileCount = computed(() => {
  let count = 0
  function countFiles(items: ProjectFile[]) {
    items.forEach(item => {
      if (item.type === 'file') count++
      if (item.children) countFiles(item.children)
    })
  }
  countFiles(files.value)
  return count
})

// 根据路径查找文件
function findFileByPath(files: ProjectFile[], path: string): ProjectFile | null {
  for (const file of files) {
    if (file.path === path) return file
    if (file.children) {
      const found = findFileByPath(file.children, path)
      if (found) return found
    }
  }
  return null
}

function handleSelectFile(file: ProjectFile) {
  projectStore.selectFile(file.id)
}

function handleContentChange(content: string) {
  if (selectedFileId.value) {
    projectStore.updateFileContent(selectedFileId.value, content)
  }
}

function copyCode() {
  if (selectedFile.value?.content) {
    navigator.clipboard.writeText(selectedFile.value.content)
    ElMessage.success('代码已复制到剪贴板')
  }
}

function handleRefresh() {
  if (previewMode.value === 'webcontainer') {
    // WebContainer 模式
    webcontainerPreviewRef.value?.reload()
  } else {
    // 浏览器编译模式
    projectStore.regeneratePreview()
    iframeKey.value++
  }
  ElMessage.success('预览已刷新')
}

function handleIframeLoad() {
  // iframe 加载完成
}

// 监听 previewMode 变化
watch(previewMode, async (newMode) => {
  if (newMode === 'webcontainer' && pageContent.value) {
    // 切换到 WebContainer 模式时，如果有内容则初始化
    await webcontainerPreviewRef.value?.init()
  }
})

// 监听来自 iframe 的错误消息
window.addEventListener('message', (event) => {
  if (event.data?.type === 'preview-error') {
    projectStore.setPreviewError(event.data.message)
  }
})
</script>

<style scoped>
.result-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.result-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 16px;
  background: #fafafa;
}

.result-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.result-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.preview-container,
.code-container {
  height: 100%;
  display: flex;
  overflow: hidden;
}

.preview-frame {
  flex: 1;
  padding: 16px;
  background: #f5f5f5;
}

.preview-frame iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.loading-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
}

.loading-icon {
  font-size: 32px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-overlay {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.error-overlay pre {
  margin-top: 8px;
  padding: 12px;
  background: #fef0f0;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.code-sidebar {
  width: 240px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  font-weight: 500;
  color: #303133;
}

.file-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.code-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.file-path {
  font-family: monospace;
  font-size: 13px;
  color: #606266;
}

.editor-content {
  flex: 1;
  overflow: hidden;
}

:deep(.el-empty) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
