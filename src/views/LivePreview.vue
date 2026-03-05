<template>
  <div class="live-preview">
    <!-- 错误显示 -->
    <div v-if="error" class="error-container">
      <div class="error-header">
        <el-icon><WarningFilled /></el-icon>
        <span>编译错误</span>
      </div>
      <pre class="error-message">{{ error }}</pre>
    </div>

    <!-- 动态组件渲染 -->
    <component v-else-if="compiledComponent" :is="compiledComponent" />

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <el-empty description="等待生成组件..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted } from 'vue'
import * as Vue from 'vue'
import * as VueCompilerSFC from '@vue/compiler-sfc'
import { WarningFilled } from '@element-plus/icons-vue'

const compiledComponent = shallowRef<Vue.Component | null>(null)
const error = ref<string | null>(null)

// BroadcastChannel 用于接收代码更新
let channel: BroadcastChannel | null = null

// 清理之前的样式
function cleanupStyles() {
  const oldStyles = document.querySelectorAll('[data-dynamic-style]')
  oldStyles.forEach(el => el.remove())
}

// 编译并渲染 Vue SFC
function compileAndRender(code: string) {
  if (!code.trim()) {
    compiledComponent.value = null
    error.value = null
    return
  }

  try {
    error.value = null
    cleanupStyles()

    // 1. 解析 SFC
    const { descriptor, errors: parseErrors } = VueCompilerSFC.parse(code, {
      filename: 'DynamicComponent.vue'
    })

    if (parseErrors.length > 0) {
      error.value = parseErrors.map(e => e.message).join('\n')
      compiledComponent.value = null
      return
    }

    // 2. 编译 script（使用 inlineTemplate）
    let scriptContent = ''
    if (descriptor.scriptSetup || descriptor.script) {
      const compiled = VueCompilerSFC.compileScript(descriptor, {
        id: 'dynamic-component',
        inlineTemplate: true, // 内联编译模板
      })
      scriptContent = compiled.content
    }

    // 3. 提取样式
    const styles = descriptor.styles.map(s => s.content)

    // 4. 创建组件
    const component = createComponent(scriptContent, descriptor, styles)
    compiledComponent.value = component

  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    compiledComponent.value = null
  }
}

// 创建组件实例
function createComponent(script: string, descriptor: VueCompilerSFC.SFCDescriptor, styles: string[]): Vue.Component {
  // 创建样式
  styles.forEach((style, index) => {
    const styleEl = document.createElement('style')
    styleEl.setAttribute('data-dynamic-style', String(index))
    styleEl.textContent = style
    document.head.appendChild(styleEl)
  })

  // 如果没有 script，使用默认的组件定义
  if (!script) {
    script = 'const _sfc_main = {}'
  }

  // 移除 import 语句，使用全局变量
  let processedScript = script
    .replace(/^import\s+.*?from\s+['"]vue['"]\s*;?\s*$/gm, '')
    .replace(/^import\s+.*?from\s+['"]@?element-plus.*?['"]\s*;?\s*$/gm, '')
    .replace(/^import\s+.*?from\s+['"]@element-plus\/icons-vue['"]\s*;?\s*$/gm, '')
    .replace(/^import\s+.*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')

  // 构建 Vue 全局变量
  const vueGlobals = `
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
    const toDisplayString = Vue.toDisplayString
    const createTextVNode = Vue.createTextVNode
    const createElementBlock = Vue.createElementBlock
    const createElementVNode = Vue.createElementVNode
    const Fragment = Vue.Fragment
    const openBlock = Vue.openBlock
    const withCtx = Vue.withCtx
    const withDirectives = Vue.withDirectives
    const resolveComponent = Vue.resolveComponent
    const createVNode = Vue.createVNode
    const renderList = Vue.renderList
    const normalizeClass = Vue.normalizeClass
    const normalizeStyle = Vue.normalizeStyle
    const mergeProps = Vue.mergeProps
    const vModelText = Vue.vModelText
    const vModelCheckbox = Vue.vModelCheckbox
    const vModelRadio = Vue.vModelRadio
    const vModelSelect = Vue.vModelSelect
    const vShow = Vue.vShow
    const resolveDirective = Vue.resolveDirective
  `

  try {
    // 创建组件定义
    const createComponentFn = new Function('Vue', `
      ${vueGlobals}

      ${processedScript}

      return typeof _sfc_main !== 'undefined' ? _sfc_main : {}
    `)

    const componentDef = createComponentFn(Vue) as Record<string, unknown>

    // 如果没有 render 函数但有 template，设置 template 属性
    if (!componentDef.render && descriptor.template) {
      componentDef.template = descriptor.template.content
    }

    return componentDef as Vue.Component
  } catch (e) {
    console.error('Component creation error:', e)
    return {
      template: `<div style="color:red;padding:20px;">组件创建错误: ${e instanceof Error ? e.message : String(e)}</div>`
    }
  }
}

onMounted(() => {
  // 创建 BroadcastChannel
  channel = new BroadcastChannel('live-preview-channel')

  // 监听代码更新消息
  channel.onmessage = (event) => {
    if (event.data?.type === 'code-update' && event.data.code) {
      compileAndRender(event.data.code)
    }
  }
})

onUnmounted(() => {
  if (channel) {
    channel.close()
  }
  cleanupStyles()
})
</script>

<style scoped>
.live-preview {
  min-height: 100vh;
  background: #fff;
}

.error-container {
  padding: 20px;
  background: #fef0f0;
  border-bottom: 1px solid #fbc4c4;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #f56c6c;
  font-weight: 500;
  margin-bottom: 12px;
}

.error-message {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  color: #606266;
  max-height: 300px;
  overflow: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}
</style>
