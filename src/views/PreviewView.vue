<template>
  <div class="preview-view">
    <el-card class="panel editor-panel" shadow="hover">
      <el-tabs v-model="activeTab" class="editor-tabs">
        <el-tab-pane label="HTML" name="html" />
        <el-tab-pane label="CSS" name="css" />
        <el-tab-pane label="JavaScript" name="js" />
      </el-tabs>

      <div class="editor-container">
        <MonacoEditor
          v-if="activeTab === 'html'"
          :value="previewStore.html"
          language="html"
          @update:value="previewStore.setHtml"
        />
        <MonacoEditor
          v-if="activeTab === 'css'"
          :value="previewStore.css"
          language="css"
          @update:value="previewStore.setCss"
        />
        <MonacoEditor
          v-if="activeTab === 'js'"
          :value="previewStore.javascript"
          language="javascript"
          @update:value="previewStore.setJavascript"
        />
      </div>
    </el-card>

    <el-card class="panel preview-panel" shadow="hover">
      <template #header>
        <div class="toolbar">
          <el-radio-group v-model="previewStore.viewport" size="small">
            <el-radio-button value="mobile">
              <el-icon><Iphone /></el-icon>
            </el-radio-button>
            <el-radio-button value="tablet">
              <el-icon><Grid /></el-icon>
            </el-radio-button>
            <el-radio-button value="desktop">
              <el-icon><Monitor /></el-icon>
            </el-radio-button>
          </el-radio-group>

          <el-button-group size="small">
            <el-button @click="previewStore.setZoom(previewStore.zoom - 0.1)">
              <el-icon><ZoomOut /></el-icon>
            </el-button>
            <el-button disabled>{{ Math.round(previewStore.zoom * 100) }}%</el-button>
            <el-button @click="previewStore.setZoom(previewStore.zoom + 0.1)">
              <el-icon><ZoomIn /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </template>

      <div class="preview-container">
        <iframe
          :srcdoc="previewStore.combinedHtml"
          :style="{
            width: previewStore.viewportWidth + 'px',
            transform: 'scale(' + previewStore.zoom + ')'
          }"
          sandbox="allow-scripts"
        ></iframe>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Iphone, Grid, Monitor, ZoomOut, ZoomIn } from '@element-plus/icons-vue'
import { usePreviewStore } from '@/stores/preview'
import MonacoEditor from '@/components/MonacoEditor.vue'

const previewStore = usePreviewStore()
const activeTab = ref<'html' | 'css' | 'js'>('html')
</script>

<style scoped>
.preview-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  height: calc(100vh - 120px);
  padding: 1rem;
}

.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-panel :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.editor-tabs {
  margin-bottom: 0.5rem;
}

.editor-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.preview-panel :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-container {
  flex: 1;
  overflow: auto;
  background: #e8e8e8;
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.preview-container iframe {
  background: white;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  transform-origin: top center;
  transition: transform 0.3s;
}
</style>