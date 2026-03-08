<template>
  <div class="generator-view">
    <el-card class="panel input-panel" shadow="hover">
      <template #header>
        <div class="panel-header">
          <span>📝 需求描述</span>
          <el-tag type="info">{{ currentLib }}</el-tag>
        </div>
      </template>
      <el-input
        v-model="store.prompt"
        type="textarea"
        :rows="6"
        placeholder="描述你想要生成的页面原型..."
        resize="none"
      />
      <div class="actions">
        <el-button
          type="success"
          :loading="store.isGenerating"
          @click="generateCode"
        >
          {{ store.isGenerating ? '生成中...' : '生成代码' }}
        </el-button>
        <el-button @click="copyCode" :disabled="!store.currentFile">
          复制代码
        </el-button>
      </div>
    </el-card>

    <el-card class="panel code-panel" shadow="hover">
      <el-tabs v-if="store.hasFiles" v-model="activeTabId" class="file-tabs">
        <el-tab-pane
          v-for="file in store.generatedFiles"
          :key="file.id"
          :label="file.filename"
          :name="file.id"
        />
      </el-tabs>

      <div class="editor-container" v-if="store.currentFile">
        <MonacoEditor
          :value="store.currentFile.content"
          :language="store.currentFile.language"
          @update:value="(v: string) => store.updateFileContent(store.currentFile!.id, v)"
        />
      </div>

      <el-empty v-else description="在左侧输入需求，点击生成原型" :image-size="80">
        <template #image>
          <span style="font-size: 48px">📄</span>
        </template>
      </el-empty>
    </el-card>

    <el-card class="panel preview-panel" shadow="hover">
      <template #header>
        <span>👁️ 实时预览</span>
      </template>
      <div class="preview-frame" v-if="store.currentFile">
        <iframe :srcdoc="previewHtml" sandbox="allow-scripts"></iframe>
      </div>
      <el-empty v-else description="生成代码后显示预览" :image-size="80">
        <template #image>
          <span style="font-size: 48px">🎨</span>
        </template>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useGeneratorStore } from '@/stores/generator'
import MonacoEditor from '@/components/MonacoEditor.vue'
import { compileVueSFC } from '@/preview/compiler'

const route = useRoute()
const store = useGeneratorStore()

const activeTabId = ref<string>('')

watch(() => store.currentFile, (file) => {
  if (file) activeTabId.value = file.id
}, { immediate: true })

watch(activeTabId, (id) => {
  if (id) store.selectFile(id)
})

const currentLib = computed(() => (route.query.lib as string) || 'ElementUI')

const previewHtml = computed(() => {
  if (!store.currentFile?.content) return ''
  
  const content = store.currentFile.content
  let template = ''
  let script = ''
  let style = ''
  
  if (store.currentFile.language === 'vue') {
    try {
      const compiled = compileVueSFC(content)
      template = compiled.descriptor.template?.content || ''
      script = compiled.script || ''
      style = compiled.styles.map(s => s.code).join('\n')
    } catch (e) {
      return `<!DOCTYPE html><html><body><pre style="color:red;padding:20px;">${e}</pre></body></html>`
    }
  } else {
    template = content
  }
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"><\/script>
  <script src="https://unpkg.com/element-plus"><\/script>
  <script src="https://unpkg.com/@element-plus/icons-vue/dist/index.iife.min.js"><\/script>
  <link rel="stylesheet" href="https://unpkg.com/element-plus/dist/index.css">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    ${style}
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    const { createApp, ref, reactive, computed, watch, onMounted, onUnmounted } = Vue;
    const { ElMessage, ElMessageBox } = ElementPlus;
    const Icons = window.ElementPlusIconsVue || {};
    
    try {
      const app = createApp({
        setup() {
          ${script.replace(/^import\s+.*from\s+['"][^'"]+['"];?\s*$/gm, '')}
        },
        template: \`${template.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`
      });
      
      Object.keys(Icons).forEach(key => {
        app.component(key, Icons[key]);
      });
      
      app.use(ElementPlus);
      app.mount('#app');
    } catch (e) {
      console.error('Vue app error:', e);
      document.getElementById('app').innerHTML = '<pre style="color:red;padding:20px;white-space:pre-wrap;">' + (e.stack || e.message) + '</pre>';
    }
  <\/script>
</body>
</html>`
})

async function generateCode() {
  if (!store.prompt.trim()) return
  store.setGenerating(true)

  setTimeout(() => {
    store.addFile({
      filename: 'GeneratedComponent.vue',
      content: getExampleCode(currentLib.value),
      language: 'vue'
    })
    store.setGenerating(false)
    store.saveToHistory()
  }, 1500)
}

function getExampleCode(lib: string) {
  if (lib === 'aui') {
    return `<template>
  <div class="user-management">
    <a-card title="用户管理">
      <a-button type="primary" @click="handleAdd">新增</a-button>
      <a-input v-model="searchText" placeholder="搜索" />
      <a-table :data-source="users" :columns="columns" />
    </a-card>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const searchText = ref('')
const users = ref([])
const columns = [{ title: '姓名', dataIndex: 'name' }]
function handleAdd() {}
\x3C/script>
<style scoped>.user-management { padding: 24px; }</style>`
  }
  return `<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <span>用户管理</span>
        <el-button type="primary">新增</el-button>
      </template>
      <el-input v-model="searchText" placeholder="搜索" />
      <el-table :data="users" />
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const searchText = ref('')
const users = ref([])
\x3C/script>
<style scoped>.user-management { padding: 24px; }</style>`
}

function copyCode() {
  if (store.currentFile) {
    navigator.clipboard.writeText(store.currentFile.content)
    ElMessage.success('代码已复制到剪贴板')
  }
}
</script>

<style scoped>
.generator-view {
  display: grid;
  grid-template-columns: 320px 1fr 1fr;
  gap: 16px;
  height: calc(100vh - 60px);
  padding: 16px;
  background: #f0f2f5;
}

.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.input-panel :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 8px;
}

.code-panel :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.file-tabs {
  --el-tabs-header-height: 40px;
}

.file-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 12px;
  background: #fafafa;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.preview-panel :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-frame {
  flex: 1;
  padding: 16px;
  background: #f5f5f5;
  overflow: auto;
}

.preview-frame iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  border-radius: 4px;
}

:deep(.el-empty) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
