<template>
  <div class="session-preview">
    <div v-if="isLoading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <VueReplPreview
      v-else
      ref="replPreviewRef"
      :files="files"
      :show-toolbar="true"
      :fullscreen="true"
      empty-text="没有可预览的文件"
      empty-icon="📄"
      loading-text="加载预览中..."
    >
      <template #toolbar-left>
        <el-button size="small" @click="goBack">
          <el-icon><Back /></el-icon>
          返回
        </el-button>
      </template>
    </VueReplPreview>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Back } from '@element-plus/icons-vue'
import { getSession, transformApiFiles } from '@/api'
import VueReplPreview from '@/components/VueReplPreview.vue'
import type { ProjectFile } from '@/types'

const route = useRoute()
const router = useRouter()

const files = ref<ProjectFile[]>([])
const isLoading = ref(false)
const replPreviewRef = ref<InstanceType<typeof VueReplPreview> | null>(null)

async function loadSessionFiles(sessionId: string) {
  isLoading.value = true
  try {
    const apiSession = await getSession(sessionId)
    if (apiSession.files) {
      files.value = transformApiFiles(apiSession.files)
    }
  } catch (error) {
    console.error('Failed to load session:', error)
    ElMessage.error('加载会话失败')
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  router.back()
}

onMounted(() => {
  const sessionId = route.query.sessionId as string
  if (sessionId) {
    loadSessionFiles(sessionId)
  } else {
    ElMessage.warning('缺少 sessionId 参数')
  }
})
</script>

<style scoped>
.session-preview {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #909399;
  font-size: 14px;
}

.loading-container .el-icon {
  font-size: 24px;
}
</style>
