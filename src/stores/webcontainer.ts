import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import {
  getWebContainer,
  initTemplate,
  updatePageContent,
  installDependencies,
  startDevServer,
  destroyWebContainer
} from '@/services/webcontainer'

export type PreviewStatus = 'idle' | 'initializing' | 'installing' | 'starting' | 'ready' | 'error'

export const useWebContainerStore = defineStore('webcontainer', () => {
  const status = ref<PreviewStatus>('idle')
  const previewUrl = ref<string | null>(null)
  const error = ref<string | null>(null)
  const progressMessage = ref<string>('')
  const currentTemplate = ref<string>('element-plus')
  const pageContent = ref<string>('')

  const isReady = computed(() => status.value === 'ready')
  const isLoading = computed(() =>
    status.value === 'initializing' ||
    status.value === 'installing' ||
    status.value === 'starting'
  )

  /**
   * 初始化预览环境
   */
  async function initPreviewEnvironment(template: string = 'element-plus'): Promise<boolean> {
    try {
      status.value = 'initializing'
      error.value = null
      progressMessage.value = '正在初始化 WebContainer...'
      currentTemplate.value = template

      const container = await getWebContainer()

      progressMessage.value = '正在加载模板...'

      // 使用默认的空页面内容初始化
      const defaultPageContent = pageContent.value || getDefaultPageContent()
      await initTemplate(container, template, defaultPageContent)

      progressMessage.value = '正在安装依赖...'
      status.value = 'installing'

      await installDependencies(container)

      progressMessage.value = '正在启动开发服务器...'
      status.value = 'starting'

      return new Promise((resolve) => {
        startDevServer(
          container,
          (url) => {
            previewUrl.value = url
            status.value = 'ready'
            progressMessage.value = ''
            resolve(true)
          },
          (errorMsg) => {
            error.value = errorMsg
            status.value = 'error'
            progressMessage.value = ''
            resolve(false)
          }
        )
      })
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Initialization failed'
      status.value = 'error'
      progressMessage.value = ''
      return false
    }
  }

  /**
   * 更新页面内容并刷新预览
   */
  async function updatePage(content: string): Promise<void> {
    pageContent.value = content

    if (status.value !== 'ready') {
      // 如果还没有准备好，先初始化
      const success = await initPreviewEnvironment(currentTemplate.value)
      if (!success) return
    }

    try {
      const container = await getWebContainer()
      await updatePageContent(container, content)
      // Vite 会自动热更新，不需要重新启动服务器
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to update page'
    }
  }

  /**
   * 防抖版本的更新方法
   */
  const debouncedUpdatePage = useDebounceFn(updatePage, 1000)

  /**
   * 重新加载预览
   */
  async function reloadPreview(): Promise<void> {
    if (pageContent.value) {
      await destroyWebContainer()
      previewUrl.value = null
      status.value = 'idle'
      await initPreviewEnvironment(currentTemplate.value)
    }
  }

  /**
   * 清理资源
   */
  async function cleanup(): Promise<void> {
    await destroyWebContainer()
    status.value = 'idle'
    previewUrl.value = null
    error.value = null
    progressMessage.value = ''
    pageContent.value = ''
  }

  /**
   * 获取默认页面内容
   */
  function getDefaultPageContent(): string {
    return `<template>
  <div class="page-container">
    <el-empty description="请输入需求生成页面" />
  </div>
</template>

<script setup>
// AI 将根据需求生成页面代码
</script>

<style scoped>
.page-container {
  padding: 20px;
}
</style>`
  }

  return {
    status,
    previewUrl,
    error,
    progressMessage,
    currentTemplate,
    pageContent,
    isReady,
    isLoading,
    initPreviewEnvironment,
    updatePage,
    debouncedUpdatePage,
    reloadPreview,
    cleanup,
    getDefaultPageContent
  }
})
