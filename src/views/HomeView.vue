<template>
  <div class="home-view">
    <div class="hero-content">
      <h1 class="title">
        <span class="title-icon">✨</span>
        <span class="title-text">Page Generator</span>
      </h1>
      <p class="subtitle">输入需求，智能生成页面原型</p>

      <el-card class="input-card" shadow="always">
        <el-input
          v-model="prompt"
          type="textarea"
          :rows="5"
          placeholder="输入你的需求，例如：&#10;生成一个登录页面，包含用户名密码输入框、记住我选项和第三方登录"
          resize="none"
          @keydown.enter.ctrl="handleGenerate"
        />

        <div class="toolbar">
          <div class="selectors">
            <el-tag type="success" effect="plain" size="large">Vue3</el-tag>
            <el-select v-model="selectedLib" style="width: 140px">
              <el-option label="ElementUI" value="ElementUI" />
              <el-option label="AUI" value="aui" />
            </el-select>
          </div>

          <el-button type="success" :disabled="!prompt.trim()" @click="handleGenerate">
            生成 ➤
          </el-button>
        </div>
      </el-card>

      <div class="supported-libs">
        支持的组件库：
        <el-tag v-for="lib in libs" :key="lib" effect="dark" round>{{ lib }}</el-tag>
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

const libs = ['ElementUI', 'AUI']
const prompt = ref('')
const selectedLib = ref('ElementUI')

function handleGenerate() {
  if (!prompt.value.trim()) return

  store.setPrompt(prompt.value)
  store.clearFiles()

  router.push({
    path: '/chat',
    query: { prompt: prompt.value, lib: selectedLib.value }
  })
}
</script>

<style scoped>
.home-view {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #e8f4f8 0%, #e6f0ff 100%);
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
  font-size: 42px;
  color: #303133;
  margin-bottom: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.title-icon {
  font-size: 36px;
}

.title-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 20px;
  color: #606266;
  margin-bottom: 40px;
}

.input-card {
  border-radius: 16px;
  margin-bottom: 24px;
}

.input-card :deep(.el-card__body) {
  padding: 24px;
}

.input-card :deep(.el-textarea__inner) {
  font-size: 16px;
  line-height: 1.6;
  box-shadow: none;
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
  align-items: center;
}

.supported-libs {
  color: #909399;
  font-size: 14px;
}

.supported-libs .el-tag {
  margin-left: 8px;
}
</style>
