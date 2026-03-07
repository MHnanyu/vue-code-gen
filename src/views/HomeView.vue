<template>
  <div class="min-h-[calc(100vh-60px)] flex items-center justify-center px-6 py-10 bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="max-w-3xl w-full text-center">
      <h1 class="text-5xl font-semibold text-gray-800 mb-3 flex items-center justify-center gap-3 leading-normal">
        <span class="text-4xl">✨</span>
        <span class="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent leading-normal">
          Page Generator
        </span>
      </h1>
      <p class="text-xl text-gray-600 mb-10">输入需求，智能生成页面原型</p>

      <el-card class="rounded-2xl mb-6" shadow="always">
        <el-input
          v-model="prompt"
          type="textarea"
          :rows="5"
          placeholder="输入你的需求，例如：&#10;生成一个登录页面，包含用户名密码输入框、记住我选项和第三方登录"
          resize="none"
          @keydown.enter.ctrl="handleGenerate"
        />

        <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div class="flex gap-3 items-center">
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

      <div class="text-gray-400 text-sm">
        支持的组件库：
        <el-tag v-for="lib in libs" :key="lib" effect="dark" round class="ml-2">{{ lib }}</el-tag>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneratorStore } from '@/stores/generator'
import { useChatStore } from '@/stores/chat'

const router = useRouter()
const store = useGeneratorStore()
const chatStore = useChatStore()

const libs = ['ElementUI', 'AUI']
const prompt = ref('')
const selectedLib = ref('ElementUI')

function handleGenerate() {
  if (!prompt.value.trim()) return

  store.setPrompt(prompt.value)
  store.clearFiles()
  chatStore.setPendingPrompt(prompt.value)

  router.push('/chat')
}
</script>

<style scoped>
:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-textarea__inner) {
  font-size: 16px;
  line-height: 1.6;
  box-shadow: none;
}
</style>
