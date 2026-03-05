<template>
  <div class="preview-view">
    <div class="panel editor-panel">
      <div class="editor-tabs">
        <button :class="['tab', { active: activeTab === 'html' }]"
                @click="activeTab = 'html'">HTML</button>
        <button :class="['tab', { active: activeTab === 'css' }]"
                @click="activeTab = 'css'">CSS</button>
        <button :class="['tab', { active: activeTab === 'js' }]"
                @click="activeTab = 'js'">JavaScript</button>
      </div>
      
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
    </div>
    
    <div class="panel preview-panel">
      <div class="toolbar">
        <div class="viewport-buttons">
          <button :class="{ active: previewStore.viewport === 'mobile' }"
                  @click="previewStore.setViewport('mobile')">📱</button>
          <button :class="{ active: previewStore.viewport === 'tablet' }"
                  @click="previewStore.setViewport('tablet')">📱</button>
          <button :class="{ active: previewStore.viewport === 'desktop' }"
                  @click="previewStore.setViewport('desktop')">🖥️</button>
        </div>
        <div class="zoom-controls">
          <button @click="previewStore.setZoom(previewStore.zoom - 0.1)">-</button>
          <span>{{ Math.round(previewStore.zoom * 100) }}%</span>
          <button @click="previewStore.setZoom(previewStore.zoom + 0.1)">+</button>
        </div>
      </div>
      
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-panel {
  padding: 1rem;
}

.editor-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.tab {
  background: #f5f5f5;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.tab.active {
  background: #42b883;
  color: white;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.preview-panel {
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
}

.viewport-buttons {
  display: flex;
  gap: 0.25rem;
}

.viewport-buttons button {
  background: #f5f5f5;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

.viewport-buttons button.active {
  background: #42b883;
  color: white;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.zoom-controls button {
  background: #f5f5f5;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
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