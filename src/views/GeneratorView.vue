<template>
  <div class="generator-view">
    <div class="panel input-panel">
      <div class="panel-header">
        <h2>📝 需求描述</h2>
        <div class="lib-badge">{{ currentLib }}</div>
      </div>
      <textarea
        v-model="store.prompt"
        placeholder="描述你想要生成的Vue组件..."
        rows="6"
      ></textarea>
      <div class="actions">
        <button class="btn-primary" @click="generateCode" :disabled="store.isGenerating">
          {{ store.isGenerating ? '生成中...' : '生成代码' }}
        </button>
        <button class="btn-secondary" @click="copyCode" :disabled="!store.currentFile">
          复制代码
        </button>
      </div>
    </div>
    
    <div class="panel code-panel">
      <div class="tabs" v-if="store.hasFiles">
        <button
          v-for="file in store.generatedFiles"
          :key="file.id"
          :class="['tab', { active: store.currentFile?.id === file.id }]"
          @click="store.selectFile(file.id)"
        >
          {{ file.filename }}
        </button>
      </div>
      
      <div class="editor-container" v-if="store.currentFile">
        <MonacoEditor
          :value="store.currentFile.content"
          :language="store.currentFile.language"
          @update:value="(v: string) => store.updateFileContent(store.currentFile!.id, v)"
        />
      </div>
      
      <div class="empty-state" v-else>
        <div class="empty-icon">📄</div>
        <p>在左侧输入需求，点击生成代码</p>
      </div>
    </div>
    
    <div class="panel preview-panel">
      <div class="panel-header">
        <h2>👁️ 实时预览</h2>
      </div>
      <div class="preview-frame" v-if="store.currentFile">
        <iframe :srcdoc="previewHtml" sandbox="allow-scripts"></iframe>
      </div>
      <div class="empty-state" v-else>
        <div class="empty-icon">🎨</div>
        <p>生成代码后显示预览</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGeneratorStore } from '@/stores/generator'
import MonacoEditor from '@/components/MonacoEditor.vue'

const route = useRoute()
const store = useGeneratorStore()

const currentLib = computed(() => (route.query.lib as string) || 'ElementUI')

const previewHtml = computed(() => {
  if (!store.currentFile?.content) return ''
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;font-family:sans-serif;background:#f5f5f5;">
  <div style="background:white;padding:20px;border-radius:8px;text-align:center;color:#666;">
    <p>组件预览区域</p>
    <small>完整预览需要运行时环境</small>
  </div>
</body>
</html>`
})

async function generateCode() {
  if (!store.prompt.trim()) return
  store.setGenerating(true)
  
  setTimeout(() => {
    store.addFile({
      id: Date.now().toString(),
      filename: 'GeneratedComponent.vue',
      content: getExampleCode(currentLib.value),
      language: 'vue',
      createdAt: new Date()
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
<\/script>
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
<\/script>
<style scoped>.user-management { padding: 24px; }</style>`
}

function copyCode() {
  if (store.currentFile) {
    navigator.clipboard.writeText(store.currentFile.content)
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}
.panel-header h2 { margin: 0; font-size: 16px; }
.lib-badge { background: #e6f7ff; color: #1890ff; padding: 4px 12px; border-radius: 4px; font-size: 12px; }
.input-panel { padding: 16px; }
.input-panel textarea { flex: 1; resize: none; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; font-size: 14px; margin-bottom: 16px; }
.actions { display: flex; gap: 8px; }
.btn-primary { background: #42b883; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; flex: 1; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.btn-secondary { background: white; border: 1px solid #ddd; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
.tabs { display: flex; gap: 4px; padding: 8px 12px; background: #fafafa; border-bottom: 1px solid #f0f0f0; }
.tab { background: transparent; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; color: #666; }
.tab.active { background: #42b883; color: white; }
.editor-container { flex: 1; overflow: hidden; }
.preview-frame { flex: 1; padding: 16px; background: #f5f5f5; overflow: auto; }
.preview-frame iframe { width: 100%; height: 100%; border: none; background: white; border-radius: 4px; }
.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #999; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }
</style>
