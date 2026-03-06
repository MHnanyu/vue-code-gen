import type { ProjectFile } from '@/types'

// 模拟生成的Vue3项目文件结构
export function generateMockProject(prompt: string): ProjectFile[] {
  return [
    {
      id: '1',
      name: 'src',
      path: '/src',
      type: 'folder',
      children: [
        {
          id: '2',
          name: 'components',
          path: '/src/components',
          type: 'folder',
          children: [
            {
              id: '3',
              name: 'HelloWorld.vue',
              path: '/src/components/HelloWorld.vue',
              type: 'file',
              language: 'vue',
              content: `<template>
  <div class="hello-world">
    <h1>{{ message }}</h1>
    <el-button type="primary" @click="handleClick">
      Click Me
    </el-button>
    <p>Count: {{ count }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const message = ref('Hello Vue 3!')
const count = ref(0)

function handleClick() {
  count.value++
}
</script>

<style scoped>
.hello-world {
  text-align: center;
  padding: 20px;
}

h1 {
  color: #42b883;
  margin-bottom: 20px;
}

p {
  margin-top: 16px;
  font-size: 18px;
}
</style>`
            },
            {
              id: '4',
              name: 'AppHeader.vue',
              path: '/src/components/AppHeader.vue',
              type: 'file',
              language: 'vue',
              content: `<template>
  <header class="app-header">
    <div class="logo">
      <span class="logo-icon">V</span>
      <span class="logo-text">Vue App</span>
    </div>
    <nav class="nav-links">
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #eee;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
  font-weight: bold;
  color: #42b883;
}

.logo-text {
  font-weight: 600;
  font-size: 18px;
}

.nav-links {
  display: flex;
  gap: 24px;
}

.nav-links a {
  color: #666;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: #42b883;
}
</style>`
            }
          ]
        },
        {
          id: '5',
          name: 'views',
          path: '/src/views',
          type: 'folder',
          children: [
            {
              id: '6',
              name: 'HomeView.vue',
              path: '/src/views/HomeView.vue',
              type: 'file',
              language: 'vue',
              content: `<template>
  <div class="home-view">
    <h1>Welcome to Vue 3</h1>
    <p>This is a generated page based on your prompt:</p>
    <blockquote>{{ prompt }}</blockquote>
    <HelloWorld />
  </div>
</template>

<script setup lang="ts">
import HelloWorld from '@/components/HelloWorld.vue'

defineProps<{
  prompt: string
}>()
</script>

<style scoped>
.home-view {
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
          ]
        },
        {
          id: '7',
          name: 'App.vue',
          path: '/src/App.vue',
          type: 'file',
          language: 'vue',
          content: `<template>
  <div id="app">
    <AppHeader />
    <main class="main-content">
      <HomeView :prompt="userPrompt" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AppHeader from './components/AppHeader.vue'
import HomeView from './views/HomeView.vue'

const userPrompt = ref('${prompt.replace(/'/g, "\\'")}')
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.main-content {
  min-height: calc(100vh - 60px);
}
</style>`
        },
        {
          id: '8',
          name: 'main.ts',
          path: '/src/main.ts',
          type: 'file',
          language: 'typescript',
          content: `import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')`
        }
      ]
    },
    {
      id: '9',
      name: 'public',
      path: '/public',
      type: 'folder',
      children: [
        {
          id: '10',
          name: 'index.html',
          path: '/public/index.html',
          type: 'file',
          language: 'html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue 3 App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`
        }
      ]
    },
    {
      id: '11',
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      language: 'json',
      content: JSON.stringify({
        name: 'vue-generated-app',
        version: '0.1.0',
        scripts: {
          dev: 'vite',
          build: 'vue-tsc && vite build',
          preview: 'vite preview'
        },
        dependencies: {
          vue: '^3.5.0',
          'element-plus': '^2.9.0'
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^5.0.0',
          typescript: '^5.9.0',
          vite: '^7.0.0',
          'vue-tsc': '^2.0.0'
        }
      }, null, 2)
    },
    {
      id: '12',
      name: 'vite.config.ts',
      path: '/vite.config.ts',
      type: 'file',
      language: 'typescript',
      content: `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})`
    }
  ]
}

// 模拟AI回复
export function generateMockAIResponse(userMessage: string): string {
  const responses = [
    `我理解您的需求："${userMessage.slice(0, 50)}..."。我已经为您生成了相应的Vue3项目代码，您可以在右侧的"Code"标签页查看完整的文件结构。`,
    `根据您的要求，我已经更新了项目代码。主要修改包括：\n1. 优化了组件结构\n2. 添加了新的功能模块\n3. 改进了样式设计`,
    `好的，我已根据您的反馈进行了调整。如果您还需要进一步的修改，请告诉我具体需求。`,
    `代码已更新完成！您可以在预览区域查看效果。如有任何问题，请随时告诉我。`
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

// 模拟API调用延迟
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
