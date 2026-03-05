<template>
  <div class="webcontainer-preview">
    <!-- 状态提示 -->
    <div v-if="isLoading" class="loading-overlay">
      <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
      <span>{{ progressMessage || '正在初始化预览环境...' }}</span>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="error-overlay">
      <el-alert type="error" :closable="false" show-icon>
        <template #title>预览错误</template>
        <pre>{{ error }}</pre>
      </el-alert>
      <el-button type="primary" @click="handleRetry" style="margin-top: 16px">
        重试
      </el-button>
    </div>

    <!-- 预览 iframe -->
    <iframe
      v-else-if="previewUrl"
      ref="previewIframe"
      :src="previewUrl"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      @load="handleLoad"
    ></iframe>

    <!-- 空状态 -->
    <el-empty v-else description="生成代码后显示预览" :image-size="80">
      <template #image>
        <span style="font-size: 48px">🎨</span>
      </template>
      <el-button type="primary" @click="handleInit">初始化预览环境</el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useWebContainerStore } from '@/stores/webcontainer'

const webcontainerStore = useWebContainerStore()

const previewIframe = ref<HTMLIFrameElement | null>(null)

const isLoading = ref(false)
const previewUrl = ref<string | null>(null)
const error = ref<string | null>(null)
const progressMessage = ref<string>('')

// Props
const props = defineProps<{
  pageContent: string
  template?: string
}>()

// 监听 pageContent 变化，更新预览
watch(
  () => props.pageContent,
  async (newContent) => {
    if (newContent && previewUrl.value) {
      // 使用防抖更新
      await webcontainerStore.debouncedUpdatePage(newContent)
    }
  }
)

// 初始化预览
async function handleInit() {
  if (!props.pageContent) {
    ElMessage.warning('请先生成页面代码')
    return
  }

  isLoading.value = true
  error.value = null
  progressMessage.value = '正在初始化...'

  try {
    // 先初始化环境
    const success = await webcontainerStore.initPreviewEnvironment(props.template || 'element-plus')

    if (success) {
      // 然后更新页面内容
      await webcontainerStore.updatePage(props.pageContent)
      previewUrl.value = webcontainerStore.previewUrl
    } else {
      error.value = webcontainerStore.error || '初始化失败'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '初始化失败'
  } finally {
    isLoading.value = false
    progressMessage.value = ''
  }
}

// 重试
async function handleRetry() {
  error.value = null
  await handleInit()
}

// iframe 加载完成
function handleLoad() {
  console.log('Preview iframe loaded')
}

// 清理
onUnmounted(async () => {
  // 不在这里清理，保持容器活跃
})

// 暴露方法给父组件
defineExpose({
  init: handleInit,
  reload: handleRetry
})
</script>

<style scoped>
.webcontainer-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.webcontainer-preview iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.loading-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.error-overlay pre {
  margin-top: 8px;
  padding: 12px;
  background: #fef0f0;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-width: 100%;
  overflow: auto;
}

:deep(.el-empty) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
