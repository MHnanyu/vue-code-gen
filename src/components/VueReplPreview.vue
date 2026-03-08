<template>
  <div class="vue-repl-preview">
    <div v-if="!hasFiles" class="empty-container">
      <el-empty :description="emptyText" :image-size="80">
        <template #image>
          <span class="text-5xl">{{ emptyIcon }}</span>
        </template>
      </el-empty>
    </div>
    <template v-else>
      <div v-if="showToolbar" class="preview-toolbar">
        <slot name="toolbar-left" />
        <div class="toolbar-right">
          <el-button
            type="primary"
            size="small"
            :disabled="!isReplReady"
            @click="exportStaticHtml"
          >
            导出 HTML
          </el-button>
        </div>
      </div>
      <div class="repl-wrapper" :class="{ fullscreen }">
        <div v-if="!isReplReady" class="preview-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>{{ loadingText }}</span>
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { Repl, useStore, useVueImportMap } from '@vue/repl'
import Monaco from '@vue/repl/monaco-editor'
import { collectAllFiles } from '@/preview/resolver'
import type { ProjectFile } from '@/types'

const props = withDefaults(defineProps<{
  files: ProjectFile[]
  fullscreen?: boolean
  showToolbar?: boolean
  emptyText?: string
  emptyIcon?: string
  loadingText?: string
}>(), {
  fullscreen: false,
  showToolbar: false,
  emptyText: '没有可预览的文件',
  emptyIcon: '📄',
  loadingText: '加载预览中...',
})

const emit = defineEmits<{
  ready: []
}>()

const isReplReady = ref(false)
const hasFiles = computed(() => props.files.length > 0)

const { importMap: vueImportMap } = useVueImportMap()

const replStore = useStore({
  builtinImportMap: computed(() => ({
    imports: {
      ...vueImportMap.value.imports,
      'element-plus': 'https://unpkg.com/element-plus@2.4.4/dist/index.full.mjs',
      '@element-plus/icons-vue': 'https://unpkg.com/@element-plus/icons-vue@2.3.1/dist/index.js',
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

function generateAppVue(newFiles: Record<string, string>): string | null {
  const firstVueFile = Object.keys(newFiles).find(name => name.endsWith('.vue'))
  if (!firstVueFile) return null
  
  const componentName = firstVueFile.replace('.vue', '')
  return `<template>
  <${componentName} />
</template>

<script setup>
import { getCurrentInstance } from 'vue'
import ${componentName} from './${firstVueFile}'
import ElementPlus from 'element-plus'
const instance = getCurrentInstance()
const app = instance?.appContext.app
if (app && !app._elementPlusRegistered) {
  app.use(ElementPlus)
  app._elementPlusRegistered = true
}
<\/script>
`
}

function syncFilesToRepl() {
  const allFiles = collectAllFiles(props.files)
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
    const appVueContent = generateAppVue(newFiles)
    if (!appVueContent) {
      isReplReady.value = false
      return
    }
    newFiles['App.vue'] = appVueContent
  }

  replStore.setFiles(newFiles, 'App.vue')
  isReplReady.value = true
  emit('ready')
}

function exportStaticHtml() {
  const replWrapper = document.querySelector('.repl-wrapper')
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

watch(() => props.files, syncFilesToRepl, { deep: true, immediate: true })

defineExpose({
  exportStaticHtml,
  isReplReady,
})
</script>

<style scoped>
.vue-repl-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.empty-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.repl-wrapper {
  flex: 1;
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

.repl-wrapper :deep(.split-pane > .left),
.repl-wrapper :deep(.split-pane > .dragger) {
  display: none !important;
}

.repl-wrapper :deep(.split-pane > .right) {
  width: 100% !important;
  height: 100% !important;
}

.repl-wrapper :deep(.output-tabs),
.repl-wrapper :deep(.tab-buttons) {
  display: none !important;
}

.repl-wrapper :deep(.output-container) {
  height: 100% !important;
}
</style>
