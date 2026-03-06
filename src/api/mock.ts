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
  <div class="main-page">
    <h1>{{ title }}</h1>
    <p>基于您的需求生成的内容：</p>
    <blockquote>{{ userPrompt }}</blockquote>
    <HelloWorld />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HelloWorld from './HelloWorld.vue'

const title = ref('Generated Page')
const userPrompt = ref('${escapedPrompt}')
</script>

<style scoped>
.main-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

h1 {
  color: #303133;
  margin-bottom: 16px;
}

blockquote {
  background: #f5f7fa;
  padding: 16px;
  border-left: 4px solid #42b883;
  margin: 20px 0;
  color: #606266;
}
</style>`
}

function generateHelloWorldContent(): string {
  return `<template>
  <div class="hello-world">
    <h2>Hello World Component</h2>
    <p>Count: {{ count }}</p>
    <el-button type="primary" @click="count++">Click Me</el-button>
    <el-divider />
    <h3>Calendar</h3>
    <el-calendar v-model="selectedDate" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
const selectedDate = ref(new Date())
</script>

<style scoped>
.hello-world {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #42b883;
  margin-bottom: 16px;
}

h3 {
  margin: 16px 0;
  color: #606266;
}

.el-button {
  margin: 10px 0;
}

.el-calendar {
  border-radius: 8px;
}
</style>`
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
