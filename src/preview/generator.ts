import * as VueCompilerSFC from '@vue/compiler-sfc'
import type { ProjectFile } from '@/types'
import { collectAllFiles } from './resolver'

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
 * 编译结果
 */
interface CompiledSFC {
  template: string
  script: string
  styles: string[]
  errors: string[]
}

/**
 * 生成 Vue 全局变量声明
 */
function generateVueGlobals(): string {
  return `
    const Vue = window.Vue
    const ref = Vue.ref
    const reactive = Vue.reactive
    const computed = Vue.computed
    const watch = Vue.watch
    const watchEffect = Vue.watchEffect
    const onMounted = Vue.onMounted
    const onUnmounted = Vue.onUnmounted
    const onBeforeMount = Vue.onBeforeMount
    const onBeforeUnmount = Vue.onBeforeUnmount
    const onUpdated = Vue.onUpdated
    const provide = Vue.provide
    const inject = Vue.inject
    const toRef = Vue.toRef
    const toRefs = Vue.toRefs
    const unref = Vue.unref
    const isRef = Vue.isRef
    const shallowRef = Vue.shallowRef
    const shallowReactive = Vue.shallowReactive
    const readonly = Vue.readonly
    const nextTick = Vue.nextTick
    const defineComponent = Vue.defineComponent
    const defineProps = Vue.defineProps
    const defineEmits = Vue.defineEmits
    const defineExpose = Vue.defineExpose
    const withDefaults = Vue.withDefaults
    const useSlots = Vue.useSlots
    const useAttrs = Vue.useAttrs
    const createElementBlock = Vue.createElementBlock
    const createElementVNode = Vue.createElementVNode
    const createBaseVNode = Vue.createBaseVNode
    const createCommentVNode = Vue.createCommentVNode
    const createStaticVNode = Vue.createStaticVNode
    const createTextVNode = Vue.createTextVNode
    const Fragment = Vue.Fragment
    const openBlock = Vue.openBlock
    const setBlockTracking = Vue.setBlockTracking
    const mergeProps = Vue.mergeProps
    const normalizeClass = Vue.normalizeClass
    const normalizeStyle = Vue.normalizeStyle
    const renderList = Vue.renderList
    const renderSlot = Vue.renderSlot
    const resolveComponent = Vue.resolveComponent
    const resolveDirective = Vue.resolveDirective
    const resolveDynamicComponent = Vue.resolveDynamicComponent
    const withCtx = Vue.withCtx
    const withDirectives = Vue.withDirectives
    const vModelText = Vue.vModelText
    const vModelCheckbox = Vue.vModelCheckbox
    const vModelRadio = Vue.vModelRadio
    const vModelSelect = Vue.vModelSelect
    const vModelDynamic = Vue.vModelDynamic
    const vShow = Vue.vShow
    const Transition = Vue.Transition
    const TransitionGroup = Vue.TransitionGroup
    const KeepAlive = Vue.KeepAlive
    const Suspense = Vue.Suspense
    const Teleport = Vue.Teleport
  `
}

/**
 * 使用 @vue/compiler-sfc 编译 Vue SFC
 */
function compileSFC(content: string, filename: string): CompiledSFC {
  const result: CompiledSFC = {
    template: '',
    script: '',
    styles: [],
    errors: [],
  }

  try {
    // 解析 SFC
    const { descriptor, errors } = VueCompilerSFC.parse(content, { filename })

    if (errors.length > 0) {
      result.errors = errors.map(e => e.message)
      return result
    }

    // 提取模板
    if (descriptor.template) {
      result.template = descriptor.template.content.trim()
    }

    // 编译 script
    if (descriptor.scriptSetup || descriptor.script) {
      try {
        // 使用 inlineTemplate: true，让 compiler-sfc 内联模板渲染
        const compiled = VueCompilerSFC.compileScript(descriptor, {
          id: 'scope-id',
          isProd: false,
          inlineTemplate: true,
        })

        let script = compiled.content

        // 移除 import 语句（运行时从全局 Vue 获取）
        script = script.replace(/^import\s+.*?from\s+['"]vue['"]\s*;?\s*$/gm, '')
        script = script.replace(/^import\s+.*?from\s+['"]@?element-plus.*?['"]\s*;?\s*$/gm, '')
        // 移除其他 import 语句（组件导入等）
        script = script.replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')

        // 移除所有 export 语句
        script = script.replace(/^export\s+default\s+[\s\S]*?;?\s*$/gm, '') // export default ...
        script = script.replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ') // export const -> const

        result.script = script
      } catch (e) {
        result.errors.push(`Script compile error: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    // 提取样式
    for (const style of descriptor.styles) {
      result.styles.push(style.content)
    }
  } catch (e) {
    result.errors.push(`Parse error: ${e instanceof Error ? e.message : String(e)}`)
  }

  return result
}

/**
 * 生成组件注册代码
 */
function generateComponentCode(file: ProjectFile): string {
  const content = file.content || ''
  const componentName = file.name.replace('.vue', '').replace(/[^a-zA-Z0-9]/g, '_')

  const compiled = compileSFC(content, file.path)

  if (compiled.errors.length > 0) {
    const errorMsg = compiled.errors.join('; ')
    return `
      console.error('Component ${file.path} errors:', ${JSON.stringify(compiled.errors)})
      app.component('${componentName}', {
        template: '<div style="color:red;padding:20px;border:1px solid red;margin:10px;">${file.path} error: ${errorMsg}</div>'
      })
    `
  }

  const styleCode = compiled.styles.map((style) => `
    (function() {
      const style = document.createElement('style')
      style.setAttribute('data-component', '${componentName}')
      style.textContent = \`${escapeTemplateString(style)}\`
      document.head.appendChild(style)
    })()
  `).join('\n')

  const script = compiled.script || 'const _sfc_main = {}'

  return `
    // Component: ${file.path}
    ;(function() {
      ${generateVueGlobals()}

      ${script}

      const componentDef = typeof _sfc_main !== 'undefined' ? _sfc_main : {}
      app.component('${componentName}', Object.assign({}, componentDef, {
        template: \`${escapeTemplateString(compiled.template)}\`,
        name: '${componentName}'
      }))
    })()

    ${styleCode}
  `
}

/**
 * 生成 App 组件代码
 */
function generateAppComponent(file: ProjectFile): string {
  const content = file.content || ''
  const compiled = compileSFC(content, file.path)

  if (compiled.errors.length > 0) {
    const errorMsg = compiled.errors.join('; ')
    return `
      console.error('App.vue errors:', ${JSON.stringify(compiled.errors)})
      app.component('App', {
        template: '<div style="color:red;padding:20px;">App.vue error: ${errorMsg}</div>'
      })
    `
  }

  const styleCode = compiled.styles.map(style => `
    (function() {
      const style = document.createElement('style')
      style.setAttribute('data-component', 'App')
      style.textContent = \`${escapeTemplateString(style)}\`
      document.head.appendChild(style)
    })()
  `).join('\n')

  const script = compiled.script || 'const _sfc_main = {}'

  return `
    // App Component
    ${styleCode}

    ;(function() {
      ${generateVueGlobals()}

      ${script}

      const componentDef = typeof _sfc_main !== 'undefined' ? _sfc_main : {}
      app.component('App', Object.assign({}, componentDef, {
        template: \`${escapeTemplateString(compiled.template)}\`,
        name: 'App'
      }))
    })()
  `
}

/**
 * 生成默认 App 组件（当没有 App.vue 时）
 */
function generateDefaultApp(): string {
  return `
    app.component('App', {
      template: \`
        <div style="padding: 20px; text-align: center;">
          <h1 style="color: #42b883;">Vue 3 Preview</h1>
          <p>No App.vue found. Please create an App.vue file.</p>
        </div>
      \`,
      name: 'App'
    })
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
  const { title = 'Vue3 Preview' } = options

  const allFiles = collectAllFiles(files)
  const vueFiles = allFiles.filter(f => f.name.endsWith('.vue'))
  const appVue = vueFiles.find(f => f.name === 'App.vue')

  const componentCodes = vueFiles
    .filter(f => f.name !== 'App.vue')
    .map(f => generateComponentCode(f))
    .join('\n')

  const appCode = appVue ? generateAppComponent(appVue) : generateDefaultApp()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/element-plus@2.9.1/dist/index.css">
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
      max-height: 50vh;
      overflow: auto;
      border-bottom: 1px solid #fbc4c4;
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

  <script>
    // 脚本加载器，支持回退
    function loadScript(src, fallbackSrc) {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = () => {
          if (fallbackSrc) {
            const fallback = document.createElement('script');
            fallback.src = fallbackSrc;
            fallback.onload = resolve;
            fallback.onerror = reject;
            document.head.appendChild(fallback);
          } else {
            reject(new Error('Failed to load: ' + src));
          }
        };
        document.head.appendChild(script);
      });
    }

    // 显示错误
    function showError(msg) {
      const container = document.getElementById('error-container');
      container.textContent = msg;
      container.style.display = 'block';
    }

    window.onerror = function(msg, url, line, col, error) {
      showError('Error: ' + msg + '\\n  at ' + url + ':' + line);
      console.error('Preview Error:', msg, url, line, col, error);
      return true;
    }

    window.addEventListener('unhandledrejection', function(event) {
      showError('Promise Error: ' + event.reason);
      console.error('Unhandled Promise Error:', event.reason);
    });

    // 加载依赖并初始化应用
    async function init() {
      try {
        // 加载 Vue
        await loadScript(
          'https://cdn.jsdelivr.net/npm/vue@3.5.13/dist/vue.global.prod.js',
          'https://unpkg.com/vue@3.5.13/dist/vue.global.prod.js'
        );

        // 加载 Element Plus
        await loadScript(
          'https://cdn.jsdelivr.net/npm/element-plus@2.9.1/dist/index.full.min.js',
          'https://unpkg.com/element-plus@2.9.1/dist/index.full.min.js'
        );

        // 加载 Element Plus Icons（可选，失败不影响主要功能）
        try {
          await loadScript(
            'https://cdn.jsdelivr.net/npm/@element-plus/icons-vue@2.3.2/dist/index.iife.min.js',
            'https://unpkg.com/@element-plus/icons-vue@2.3.2/dist/index.iife.min.js'
          );
        } catch (e) {
          console.warn('Failed to load Element Plus icons:', e);
        }

        // 初始化应用
        const Vue = window.Vue;
        const ElementPlus = window.ElementPlus;
        const ElementPlusIconsVue = window.ElementPlusIconsVue || {};

        const app = Vue.createApp({});
        app.config.compilerOptions.isCustomElement = () => false;
        app.use(ElementPlus);

        // 注册图标组件
        for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
          app.component(key, component);
        }

        ${componentCodes}

        ${appCode}

        app.mount('#app');

      } catch (error) {
        showError('Failed to load dependencies: ' + error.message);
        console.error('Init Error:', error);
      }
    }

    init();
  </script>
</body>
</html>`
}

/**
 * 检测组件库
 */
export function detectLibrary(files: ProjectFile[]): string {
  const allFiles = collectAllFiles(files)
  for (const file of allFiles) {
    const content = file.content || ''
    if (content.includes('element-plus') || content.includes('ElementPlus')) {
      return 'element-plus'
    }
  }
  return 'element-plus'
}
