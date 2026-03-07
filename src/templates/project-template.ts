import type { ProjectFile } from '@/types'

export const MAIN_TS = `import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
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
    '@vitejs/plugin-vue': '^6.0.0',
    tailwindcss: '^4.0.0',
    '@tailwindcss/vite': '^4.0.0',
    typescript: '^5.9.0',
    vite: '^7.0.0',
    'vue-tsc': '^3.0.0'
  }
}, null, 2)

export const VITE_CONFIG_TS = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
`

export const STYLE_CSS = `@import "tailwindcss";
`

export const TS_CONFIG = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
`

export const VITE_ENV_D_TS = `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
`

export function getBaseProjectFiles(): ProjectFile[] {
  return [
    {
      id: 'main-ts',
      name: 'main.ts',
      path: '/src/main.ts',
      type: 'file',
      language: 'typescript',
      content: MAIN_TS,
      readonly: true
    },
    {
      id: 'app-vue',
      name: 'App.vue',
      path: '/src/App.vue',
      type: 'file',
      language: 'vue',
      content: APP_VUE,
      readonly: true
    },
    {
      id: 'style-css',
      name: 'style.css',
      path: '/src/style.css',
      type: 'file',
      language: 'css',
      content: STYLE_CSS,
      readonly: true
    },
    {
      id: 'vite-env-d-ts',
      name: 'vite-env.d.ts',
      path: '/src/vite-env.d.ts',
      type: 'file',
      language: 'typescript',
      content: VITE_ENV_D_TS,
      readonly: true
    },
    {
      id: 'index-html',
      name: 'index.html',
      path: '/index.html',
      type: 'file',
      language: 'html',
      content: INDEX_HTML,
      readonly: true
    },
    {
      id: 'package-json',
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      language: 'json',
      content: PACKAGE_JSON,
      readonly: true
    },
    {
      id: 'vite-config',
      name: 'vite.config.ts',
      path: '/vite.config.ts',
      type: 'file',
      language: 'typescript',
      content: VITE_CONFIG_TS,
      readonly: true
    },
    {
      id: 'tsconfig-json',
      name: 'tsconfig.json',
      path: '/tsconfig.json',
      type: 'file',
      language: 'json',
      content: TS_CONFIG,
      readonly: true
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
      baseFiles[2],
      baseFiles[3],
      mainPageFile,
      ...extraComponents
    ]
  }

  return [
    srcFolder,
    baseFiles[4],
    baseFiles[5],
    baseFiles[6],
    baseFiles[7]
  ]
}
