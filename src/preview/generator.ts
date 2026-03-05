import type { ProjectFile } from '@/types'
import { stripTypes } from './compiler'
import { collectAllFiles } from './resolver'

// 组件库配置
interface LibraryConfig {
  name: string
  css: string[]
  setup: string
}

// 支持的组件库
const LIBRARY_CONFIGS: Record<string, LibraryConfig> = {
  'element-plus': {
    name: 'ElementPlus',
    css: ['https://unpkg.com/element-plus@2.9.1/dist/index.css'],
    setup: `
      app.use(ElementPlus)
      // 注册所有图标组件
      for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
        app.component(key, component)
      }
    `,
  },
}

/**
 * 转义模板字符串中的特殊字符
 */
function escapeTemplateString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
}

/**
 * 从 Vue SFC 内容中提取 template
 */
function extractTemplate(content: string): string {
  const match = content.match(/<template>([\s\S]*?)<\/template>/)
  return match ? match[1].trim() : ''
}

/**
 * 从 Vue SFC 内容中提取 script setup 内容
 */
function extractScriptSetup(content: string): string {
  const match = content.match(/<script\s+setup[^>]*>([\s\S]*?)<\/script>/)
  return match ? match[1].trim() : ''
}

/**
 * 从 Vue SFC 内容中提取 script (非 setup) 内容
 */
function extractScript(content: string): string {
  const match = content.match(/<script[^>]*>([\s\S]*?)<\/script>/)
  if (!match) return ''
  // 排除 script setup
  if (match[0].includes('setup')) return ''
  return match[1].trim()
}

/**
 * 从 Vue SFC 内容中提取 style 内容
 */
function extractStyles(content: string): string[] {
  const styles: string[] = []
  const regex = /<style[^>]*>([\s\S]*?)<\/style>/g
  let match
  while ((match = regex.exec(content)) !== null) {
    styles.push(match[1].trim())
  }
  return styles
}

/**
 * 生成组件代码
 */
function generateComponentCode(file: ProjectFile): string {
  const content = file.content || ''
  const componentName = file.name.replace('.vue', '').replace(/[^a-zA-Z0-9]/g, '_')

  const template = extractTemplate(content)
  const scriptSetup = extractScriptSetup(content)
  const script = extractScript(content)
  const styles = extractStyles(content)

  // 处理 script setup 代码
  let processedScript = scriptSetup || script
  processedScript = stripTypes(processedScript)
  // 移除 import 语句（我们会在运行时提供）
  processedScript = processedScript.replace(/import\s+[^;]+;?\n?/g, '')

  // 生成样式代码
  const styleCode = styles.map(style => `
    (function() {
      const style = document.createElement('style')
      style.textContent = \`${escapeTemplateString(style)}\`
      document.head.appendChild(style)
    })()
  `).join('\n')

  // 生成组件定义
  return `
    // Component: ${file.path}
    const ${componentName}Component = (function() {
      // 组件选项
      const __options = {}

      // 模板
      const __template = \`${escapeTemplateString(template)}\`

      // Script setup 逻辑
      ${processedScript}

      // 收集 exports
      const __exports = {}

      // 定义响应式变量
      const ref = Vue.ref
      const reactive = Vue.reactive
      const computed = Vue.computed
      const watch = Vue.watch
      const onMounted = Vue.onMounted
      const onUnmounted = Vue.onUnmounted
      const defineProps = () => ({})
      const defineEmits = () => () => {}
      const defineExpose = () => {}

      // 返回组件定义
      return {
        template: __template,
        name: '${componentName}',
        ...__exports
      }
    })()

    // 注册样式
    ${styleCode}

    // 注册组件
    app.component('${componentName}', ${componentName}Component)
  `
}

/**
 * 生成预览 HTML
 */
export function generatePreviewHtml(
  files: ProjectFile[],
  options: {
    title?: string
    library?: string
  } = {}
): string {
  const { title = 'Vue3 Preview', library = 'element-plus' } = options
  const libConfig = LIBRARY_CONFIGS[library] || LIBRARY_CONFIGS['element-plus']

  const allFiles = collectAllFiles(files)
  const vueFiles = allFiles.filter(f => f.name.endsWith('.vue'))
  const appVue = vueFiles.find(f => f.name === 'App.vue')

  // 生成组件注册代码
  const componentCodes = vueFiles
    .filter(f => f.name !== 'App.vue')
    .map(f => generateComponentCode(f))
    .join('\n')

  // 生成 App 组件代码
  let appCode = ''
  if (appVue) {
    appCode = generateAppComponent(appVue)
  } else {
    // 默认 App
    appCode = `
      const App = {
        template: \`
          <div style="padding: 20px; text-align: center;">
            <h1 style="color: #42b883;">Vue 3 Preview</h1>
            <p>No App.vue found. Please create an App.vue file.</p>
          </div>
        \`
      }
    `
  }

  // CSS 链接
  const cssLinks = libConfig.css
    .map(url => `<link rel="stylesheet" href="${url}">`)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${cssLinks}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      background: #fff;
    }
    #app { min-height: 100vh; }
    #error-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #fef0f0;
      color: #f56c6c;
      padding: 12px 16px;
      font-size: 14px;
      z-index: 9999;
      white-space: pre-wrap;
      display: none;
    }
    #error-container:not(:empty) { display: block; }
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #909399;
      gap: 12px;
    }
    .spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #409eff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="error-container"></div>
  <div id="app">
    <div class="loading">
      <div class="spinner"></div>
      <span>Loading preview...</span>
    </div>
  </div>

  <script type="module">
    // 导入 Vue (使用 esm.sh 获得更好的 CORS 支持)
    import * as Vue from 'https://esm.sh/vue@3.5.13'
    import * as ElementPlus from 'https://esm.sh/element-plus@2.9.1'
    import * as ElementPlusIconsVue from 'https://esm.sh/@element-plus/icons-vue@2.3.2'

    // 全局错误处理
    window.onerror = function(msg, url, line, col, error) {
      const container = document.getElementById('error-container')
      container.textContent = 'Error: ' + msg + '\\n  at line ' + line + ': ' + url
      container.style.display = 'block'
      console.error('Preview Error:', msg, url, line, col, error)
      return true
    }

    // 未捕获的 Promise 错误
    window.addEventListener('unhandledrejection', function(event) {
      const container = document.getElementById('error-container')
      container.textContent = 'Promise Error: ' + event.reason
      container.style.display = 'block'
      console.error('Unhandled Promise Error:', event.reason)
    })

    try {
      // 创建应用
      const app = Vue.createApp({})

      // 使用组件库
      ${libConfig.setup}

      // 注册子组件
      ${componentCodes}

      // App 组件
      ${appCode}

      // 挂载
      app.mount('#app')

    } catch (error) {
      const container = document.getElementById('error-container')
      container.textContent = 'Compilation Error: ' + error.message
      container.style.display = 'block'
      console.error('Compilation Error:', error)
    }
  </script>
</body>
</html>`
}

/**
 * 生成 App 组件代码
 */
function generateAppComponent(file: ProjectFile): string {
  const content = file.content || ''
  const template = extractTemplate(content)
  const scriptSetup = extractScriptSetup(content)
  const script = extractScript(content)
  const styles = extractStyles(content)

  // 处理 script
  let processedScript = scriptSetup || script
  processedScript = stripTypes(processedScript)
  processedScript = processedScript.replace(/import\s+[^;]+;?\n?/g, '')

  // 生成样式
  const styleCode = styles.map(style => `
    (function() {
      const style = document.createElement('style')
      style.textContent = \`${escapeTemplateString(style)}\`
      document.head.appendChild(style)
    })()
  `).join('\n')

  return `
    ${styleCode}

    const App = (function() {
      const ref = Vue.ref
      const reactive = Vue.reactive
      const computed = Vue.computed
      const watch = Vue.watch
      const onMounted = Vue.onMounted
      const onUnmounted = Vue.onUnmounted
      const defineProps = () => ({})
      const defineEmits = () => () => {}
      const defineExpose = () => {}

      ${processedScript}

      return {
        template: \`${escapeTemplateString(template)}\`,
        name: 'App'
      }
    })()

    app.component('App', App)
  `
}

/**
 * 检测项目使用的组件库
 */
export function detectLibrary(files: ProjectFile[]): string {
  const allFiles = collectAllFiles(files)

  for (const file of allFiles) {
    const content = file.content || ''

    if (content.includes('element-plus') || content.includes('ElementPlus')) {
      return 'element-plus'
    }
    // 可扩展其他组件库
    // if (content.includes('ant-design-vue')) return 'ant-design-vue'
    // if (content.includes('vant')) return 'vant'
  }

  return 'element-plus'
}
