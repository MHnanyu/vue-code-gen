<template>
  <div class="result-panel">
    <div class="result-header">
      <el-button type="primary" :icon="RefreshRight" @click="handleRefresh" :disabled="!hasCode">
        刷新预览
      </el-button>
      <el-tag v-if="isModified" type="warning" size="small">代码已修改</el-tag>
    </div>
    <el-tabs v-model="activeTab" class="result-tabs">
      <el-tab-pane label="Preview" name="preview">
        <div class="preview-container">
          <!-- 加载状态 -->
          <div v-if="!hasCode" class="empty-overlay">
            <el-empty description="生成代码后显示预览" :image-size="80">
              <template #image>
                <span style="font-size: 48px">🎨</span>
              </template>
            </el-empty>
          </div>

          <!-- 预览 iframe -->
          <div v-else class="preview-frame">
            <iframe
              ref="previewIframe"
              :key="iframeKey"
              src="/live-preview"
              sandbox="allow-scripts allow-same-origin"
            ></iframe>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Code" name="code">
        <div class="code-container">
          <div class="editor-header">
            <span class="file-path">GeneratedComponent.vue</span>
            <div class="editor-actions">
              <el-button text size="small" @click="copyCode">
                <el-icon><CopyDocument /></el-icon>
                复制
              </el-button>
              <el-button text size="small" @click="resetCode" :disabled="!isModified">
                <el-icon><RefreshRight /></el-icon>
                重置
              </el-button>
            </div>
          </div>
          <div class="editor-content">
            <MonacoEditor
              v-if="hasCode"
              :value="componentCode"
              language="vue"
              @update:value="handleContentChange"
            />
            <el-empty v-else description="AI 生成的代码将显示在这里" :image-size="80">
              <template #image>
                <span style="font-size: 48px">📄</span>
              </template>
            </el-empty>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { CopyDocument, RefreshRight } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import MonacoEditor from '@/components/MonacoEditor.vue'

const projectStore = useProjectStore()

const activeTab = ref('preview')
const iframeKey = ref(0)
const previewIframe = ref<HTMLIFrameElement | null>(null)

// BroadcastChannel 用于与 iframe 通信
let channel: BroadcastChannel | null = null

const componentCode = computed(() => projectStore.componentCode)
const hasCode = computed(() => projectStore.hasCode)
const isModified = computed(() => projectStore.isModified)

// 发送代码到 iframe
function sendCodeToIframe(code: string) {
  if (channel && code) {
    channel.postMessage({ type: 'code-update', code })
  }
}

// 处理代码变更
function handleContentChange(content: string) {
  projectStore.updateComponentCode(content)
  // 立即发送到 iframe
  sendCodeToIframe(content)
}

// 刷新预览
function handleRefresh() {
  iframeKey.value++
  projectStore.refreshPreview()
  // 等待 iframe 重新加载后发送代码
  setTimeout(() => {
    sendCodeToIframe(componentCode.value)
  }, 200)
  ElMessage.success('预览已刷新')
}

// 复制代码
function copyCode() {
  if (componentCode.value) {
    navigator.clipboard.writeText(componentCode.value)
    ElMessage.success('代码已复制到剪贴板')
  }
}

// 重置代码（撤销修改）
function resetCode() {
  ElMessage.info('功能待实现')
}

// 监听代码变化，同步到 iframe
watch(componentCode, (code) => {
  if (code && channel) {
    sendCodeToIframe(code)
  }
})

// 监听 activeTab 变化，切换到 preview 时发送代码
watch(activeTab, (newTab) => {
  if (newTab === 'preview' && componentCode.value && channel) {
    nextTick(() => {
      sendCodeToIframe(componentCode.value)
    })
  }
})

// 监听 store 的 previewKey 变化
watch(() => projectStore.previewKey, () => {
  setTimeout(() => {
    sendCodeToIframe(componentCode.value)
  }, 200)
})

onMounted(() => {
  channel = new BroadcastChannel('live-preview-channel')

  // 如果已有代码，延迟发送到 iframe
  if (hasCode.value) {
    setTimeout(() => {
      sendCodeToIframe(componentCode.value)
    }, 500)
  }
})

onUnmounted(() => {
  if (channel) {
    channel.close()
  }
})
</script>

<style scoped>
.result-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.result-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 16px;
  background: #fafafa;
}

.result-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.result-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.preview-container,
.code-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-frame {
  flex: 1;
  padding: 16px;
  background: #f5f5f5;
}

.preview-frame iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.empty-overlay {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #fafafa;
  border-bottom: 1px solid #eee;
}

.file-path {
  font-family: monospace;
  font-size: 13px;
  color: #606266;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.editor-content {
  flex: 1;
  overflow: hidden;
}

:deep(.el-empty) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
