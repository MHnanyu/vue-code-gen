<template>
  <div class="result-panel">
    <div v-if="!hasFiles" class="empty-state">
      <el-empty description="生成代码后显示预览" :image-size="80">
        <template #image>
          <span style="font-size: 48px">🎨</span>
        </template>
      </el-empty>
    </div>
    <template v-else>
      <el-tabs v-model="activeTab" class="result-tabs">
        <el-tab-pane label="Preview" name="preview" />
        <el-tab-pane label="Code" name="code" />
      </el-tabs>
      <div class="repl-wrapper" :class="activeTab">
        <Repl
          :store="replStore"
          :editor="Monaco"
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
import { useDebounceFn } from '@vueuse/core'
import { Repl, useStore, useVueImportMap, File } from '@vue/repl'
import Monaco from '@vue/repl/monaco-editor'
import { useProjectStore } from '@/stores/project'
import { collectAllFiles } from '@/preview/resolver'

const projectStore = useProjectStore()
const activeTab = ref('preview')
const hasFiles = computed(() => projectStore.files.length > 0)

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

// @vue/repl 的 resolveImport 只处理 "./" 前缀（转成 "src/"），不支持 "../" 和 "@/"
// 方案：所有文件扁平化到 src/ 根，import 路径统一改成 "./文件名"
const SUPPORTED_EXTS = /\.(vue|ts|tsx|js|jsx)$/

function normalizeImports(content: string, filename: string): string {
  let result = content

  // 为 App.vue 自动添加 Element Plus 和 Tailwind CSS
  if (filename === 'App.vue') {
    const scriptMatch = result.match(/(<script\s+setup[^>]*>)([\s\S]*?)(<\/script>)/)
    if (scriptMatch && !scriptMatch[2].includes('element-plus')) {
      const needsVueImports = []
      if (!scriptMatch[2].includes('getCurrentInstance')) needsVueImports.push('getCurrentInstance')
      if (!scriptMatch[2].includes('onMounted')) needsVueImports.push('onMounted')
      
      const vueImport = needsVueImports.length > 0 
        ? `import { ${needsVueImports.join(', ')} } from 'vue'\n` 
        : ''
      
      const cssInject = `onMounted(() => {
  // Element Plus CSS
  if (!document.querySelector('link[data-element-plus-css]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/element-plus@2.4.4/dist/index.css'
    link.dataset.elementPlusCss = 'true'
    document.head.appendChild(link)
  }
  // Tailwind CSS
  if (!document.querySelector('script[data-tailwind]')) {
    const script = document.createElement('script')
    script.src = 'https://cdn.tailwindcss.com'
    script.dataset.tailwind = 'true'
    document.head.appendChild(script)
  }
})
`
      
      const newScript = scriptMatch[1] + 
        `\n${vueImport}import ElementPlus from 'element-plus'\n` +
        cssInject +
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

  // 移除所有 CSS import（@vue/repl 不支持）
  result = result
    .replace(/^import\s+['"][^'"]+\.css['"]\s*;?\s*$/gm, '')
    // @/path/to/File.vue → ./File.vue
    .replace(/(['"])@\/(?:[^'"]*\/)?([^/'"]+)\1/g, '$1./$2$1')
    // ./path/to/File.vue 或 ../path/to/File.vue → ./File.vue
    .replace(/(['"])\.\.?\/(?:[^'"]*\/)?([^/'"]+\.(vue|ts|tsx|js|jsx))\1/g, '$1./$2$1')

  return result
}

function syncFilesToRepl() {
  const allFiles = collectAllFiles(projectStore.files)
  if (allFiles.length === 0) return

  const newFiles: Record<string, string> = {}
  for (const f of allFiles) {
    if (!f.content || !SUPPORTED_EXTS.test(f.name)) continue
    // 扁平化：所有文件放到 src/ 根，key = "src/FileName.vue"
    newFiles[f.name] = normalizeImports(f.content, f.name)
  }
  if (!newFiles['App.vue']) return

  replStore.setFiles(newFiles, 'App.vue')
}

const debouncedSync = useDebounceFn(syncFilesToRepl, 300)
watch(() => projectStore.files, debouncedSync, { deep: true, immediate: true })
</script>

<style scoped>
.result-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-tabs {
  flex-shrink: 0;
}

.result-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 16px;
  background: #fafafa;
  border-bottom: 1px solid #e4e7ed;
}

.result-tabs :deep(.el-tabs__content) {
  display: none;
}

.repl-wrapper {
  flex: 1;
  overflow: hidden;
}

/* preview tab: 隐藏编辑器，只显示预览 */
.repl-wrapper.preview :deep(.split-pane > .left),
.repl-wrapper.preview :deep(.split-pane > .dragger) {
  display: none !important;
}
.repl-wrapper.preview :deep(.split-pane > .right) {
  width: 100% !important;
  height: 100% !important;
}

/* code tab: 隐藏预览，只显示编辑器 */
.repl-wrapper.code :deep(.split-pane > .right),
.repl-wrapper.code :deep(.split-pane > .dragger) {
  display: none !important;
}
.repl-wrapper.code :deep(.split-pane > .left) {
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: row !important;
}

/* 文件列表变成垂直侧边栏 */
.repl-wrapper.code :deep(.file-selector) {
  display: flex;
  flex-direction: column;
  width: 160px;
  min-width: 160px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  border-right: 1px solid #e4e7ed;
  border-bottom: none;
  flex-shrink: 0;
}
.repl-wrapper.code :deep(.file-selector .file) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 编辑器占满剩余空间 */
.repl-wrapper.code :deep(.editor-container) {
  flex: 1;
  overflow: hidden;
  height: 100%;
}
</style>
