<template>
  <div class="vue-repl-wrapper">
    <Repl
      v-if="initialized && store"
      :store="store"
      :layout="layout"
      :theme="theme"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Repl } from '@vue/repl'
import { useStore } from '@vue/repl/core'
import '@vue/repl/style.css'

interface Props {
  code: string
  layout?: 'vertical' | 'horizontal'
  theme?: 'light' | 'dark'
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'horizontal',
  theme: 'light'
})

const emit = defineEmits<{
  'update:code': [code: string]
}>()

const store = ref<ReturnType<typeof useStore> | null>(null)
const initialized = ref(false)
const isInternalUpdate = ref(false)

// 初始化 Store（只执行一次）
onMounted(async () => {
  // 创建 store
  const newStore = useStore({
    builtinImportMap: {
      imports: {
        vue: 'https://unpkg.com/vue@3/dist/vue.esm-browser.js',
        'element-plus': 'https://esm.sh/element-plus',
        'element-plus/dist/index.css': 'https://esm.sh/element-plus/dist/index.css'
      }
    }
  })

  // 等待 store 初始化
  await newStore.init()

  store.value = newStore
  initialized.value = true

  // 设置初始文件
  if (props.code.trim()) {
    await updateStoreFiles(newStore, props.code)
  }

  // 监听 App.vue 文件变化（只监听一次）
  watch(() => newStore.files['App.vue']?.code, (newCode) => {
    if (newCode && !isInternalUpdate.value) {
      emit('update:code', newCode)
    }
  })
})

// 更新 store 中的文件
async function updateStoreFiles(storeInstance: ReturnType<typeof useStore>, code: string) {
  isInternalUpdate.value = true

  await storeInstance.setFiles({
    'App.vue': code,
    'index.html': `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue Preview</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"><\/script>
</body>
</html>`,
    'src/main.ts': `import { createApp } from 'vue'
import App from '../App.vue'

createApp(App).mount('#app')`
  }, 'App.vue')

  // 延迟重置标志，确保更新完成
  setTimeout(() => {
    isInternalUpdate.value = false
  }, 100)
}

// 监听外部代码变化
watch(() => props.code, async (newCode) => {
  if (store.value && initialized.value && newCode.trim()) {
    await updateStoreFiles(store.value, newCode)
  }
})
</script>

<style scoped>
.vue-repl-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.vue-repl-wrapper :deep(.vue-repl) {
  height: 100%;
}
</style>
