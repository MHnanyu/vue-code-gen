import type { ProjectFile } from '@/types'
import { buildProjectFiles } from '@/templates/project-template'

export function generateMockProject(prompt: string): ProjectFile[] {
  const mainPageContent = generateMainPageContent(prompt)
  const helloWorldContent = generateHelloWorldContent()
  const helloWorldFile: ProjectFile = {
    id: 'hello-world',
    name: 'HelloWorld.vue',
    path: '/src/HelloWorld.vue',
    type: 'file',
    language: 'vue',
    content: helloWorldContent
  }
  return buildProjectFiles(mainPageContent, [helloWorldFile])
}

function generateMainPageContent(prompt: string): string {
  const escapedPrompt = prompt.replace(/'/g, "\\'")
  return `<template>
  <div class="max-w-3xl mx-auto p-10">
    <h1 class="text-2xl font-bold text-gray-800 mb-4">{{ title }}</h1>
    <p class="text-gray-600">基于您的需求生成的内容：</p>
    <blockquote class="bg-gray-100 p-4 border-l-4 border-emerald-500 my-5 text-gray-500">
      {{ userPrompt }}
    </blockquote>
    <HelloWorld />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HelloWorld from './HelloWorld.vue'

const title = ref('Generated Page')
const userPrompt = ref('${escapedPrompt}')
</script>
`
}

function generateHelloWorldContent(): string {
  return `<template>
  <div class="p-5 bg-white rounded-lg shadow-md">
    <h2 class="text-xl text-emerald-500 mb-4">Hello World Component</h2>
    <p class="text-gray-700 mb-2">Count: {{ count }}</p>
    <el-button type="primary" @click="count++">Click Me</el-button>
    <el-divider />
    <h3 class="my-4 text-gray-600">Calendar</h3>
    <el-calendar v-model="selectedDate" class="rounded-lg" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
const selectedDate = ref(new Date())
</script>
`
}

export function generateMockAIResponse(userMessage: string): string {
  const responses = [
    `我理解您的需求："${userMessage.slice(0, 50)}..."。我已经为您生成了相应的Vue3项目代码，您可以在右侧的"Code"标签页查看完整的文件结构。`,
    `根据您的要求，我已经更新了项目代码。主要修改包括：优化了组件结构、添加了新的功能模块、改进了样式设计`,
    `好的，我已根据您的反馈进行了调整。如果您还需要进一步的修改，请告诉我具体需求。`,
    `代码已更新完成！您可以在预览区域查看效果。如有任何问题,请随时告诉我。`
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
