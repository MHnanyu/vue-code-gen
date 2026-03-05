<template>
  <div class="home-view">
    <div class="hero-content">
      <h1 class="title">🎯 Hello</h1>
      <p class="subtitle">描述你想生成的 Vue3 组件</p>
      
      <div class="input-card">
        <textarea
          v-model="prompt"
          placeholder="输入你的需求，例如：&#10;创建一个用户管理表格，包含搜索、分页、新增编辑功能"
          rows="5"
          @keydown.enter.ctrl="handleGenerate"
        ></textarea>
        
        <div class="toolbar">
          <div class="selectors">
            <div class="selector">
              <span class="selector-value vue-tag">Vue3</span>
            </div>
            
            <div class="selector dropdown-wrapper">
              <button class="selector-btn" @click="showDropdown = !showDropdown">
                <span>{{ selectedLib }}</span>
                <span class="arrow">▼</span>
              </button>
              <div class="dropdown" v-if="showDropdown">
                <div 
                  class="dropdown-item" 
                  :class="{ active: selectedLib === 'ElementUI' }"
                  @click="selectLib('ElementUI')"
                >
                  ElementUI
                </div>
                <div 
                  class="dropdown-item" 
                  :class="{ active: selectedLib === 'aui' }"
                  @click="selectLib('aui')"
                >
                  aui (内部)
                </div>
              </div>
            </div>
          </div>
          
          <button class="generate-btn" @click="handleGenerate" :disabled="!prompt.trim()">
            生成 ➤
          </button>
        </div>
      </div>
      
      <div class="supported-libs">
        支持的组件库：
        <span class="lib-tag">ElementUI</span>
        <span class="lib-tag">aui (内部)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneratorStore } from '@/stores/generator'

const router = useRouter()
const store = useGeneratorStore()

const prompt = ref('')
const selectedLib = ref('ElementUI')
const showDropdown = ref(false)

function selectLib(lib: string) {
  selectedLib.value = lib
  showDropdown.value = false
}

function handleGenerate() {
  if (!prompt.value.trim()) return
  
  store.setPrompt(prompt.value)
  store.clearFiles()
  
  router.push({
    path: '/generator',
    query: { lib: selectedLib.value }
  })
}
</script>

<style scoped>
.home-view {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}

.hero-content {
  max-width: 800px;
  width: 100%;
  text-align: center;
}

.title {
  font-size: 48px;
  color: white;
  margin-bottom: 12px;
  font-weight: 600;
}

.subtitle {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 40px;
}

.input-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  margin-bottom: 24px;
}

.input-card textarea {
  width: 100%;
  border: none;
  font-size: 16px;
  resize: none;
  outline: none;
  color: #333;
  line-height: 1.6;
  font-family: inherit;
  min-height: 120px;
}

.input-card textarea::placeholder {
  color: #999;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.selectors {
  display: flex;
  gap: 12px;
}

.selector {
  display: flex;
  align-items: center;
}

.selector-value {
  background: #f5f5f5;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.vue-tag {
  color: #42b883;
  font-weight: 500;
}

.selector-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.selector-btn .arrow {
  color: #999;
  font-size: 10px;
}

.dropdown-wrapper {
  position: relative;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 140px;
  z-index: 100;
  overflow: hidden;
}

.dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item.active {
  background: #42b883;
  color: white;
}

.generate-btn {
  background: #42b883;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.generate-btn:hover:not(:disabled) {
  background: #3aa876;
  transform: translateY(-1px);
}

.generate-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.supported-libs {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.lib-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 4px;
  margin-left: 8px;
}
</style>
