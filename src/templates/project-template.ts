import type { ProjectFile } from '@/types'

export const MAIN_TS = `import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')
`

export const APP_VUE = `<template>
  <div id="app">
    <MainPage />
  </div>
</template>

<script setup lang="ts">
import MainPage from './MainPage.vue'
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
</style>
`

export const INDEX_HTML = `<!DOCTYPE html>
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
</html>
`

export const PACKAGE_JSON = JSON.stringify({
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

export const VITE_CONFIG_TS = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
`

export function getBaseProjectFiles(): ProjectFile[] {
  return [
    {
      id: 'main-ts',
      name: 'main.ts',
      path: '/src/main.ts',
      type: 'file',
      language: 'typescript',
      content: MAIN_TS
    },
    {
      id: 'app-vue',
      name: 'App.vue',
      path: '/src/App.vue',
      type: 'file',
      language: 'vue',
      content: APP_VUE
    },
    {
      id: 'index-html',
      name: 'index.html',
      path: '/public/index.html',
      type: 'file',
      language: 'html',
      content: INDEX_HTML
    },
    {
      id: 'package-json',
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      language: 'json',
      content: PACKAGE_JSON
    },
    {
      id: 'vite-config',
      name: 'vite.config.ts',
      path: '/vite.config.ts',
      type: 'file',
      language: 'typescript',
      content: VITE_CONFIG_TS
    }
  ]
}

export function buildProjectFiles(
  mainPageContent: string,
  extraComponents: ProjectFile[] = []
): ProjectFile[] {
  const mainPageFile: ProjectFile = {
    id: 'main-page',
    name: 'MainPage.vue',
    path: '/src/MainPage.vue',
    type: 'file',
    language: 'vue',
    content: mainPageContent
  }

  const baseFiles = getBaseProjectFiles()

  const srcFolder: ProjectFile = {
    id: 'src-folder',
    name: 'src',
    path: '/src',
    type: 'folder',
    children: [
      baseFiles[0],
      baseFiles[1],
      mainPageFile,
      ...extraComponents
    ]
  }

  const publicFolder: ProjectFile = {
    id: 'public-folder',
    name: 'public',
    path: '/public',
    type: 'folder',
    children: [baseFiles[2]]
  }

  return [
    srcFolder,
    publicFolder,
    baseFiles[3],
    baseFiles[4]
  ]
}
