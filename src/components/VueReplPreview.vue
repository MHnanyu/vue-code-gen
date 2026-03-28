<template>
  <div class="vue-repl-preview">
    <div v-if="!hasFiles" class="empty-container">
      <el-empty :description="emptyText" :image-size="80">
        <template #image>
          <span class="text-5xl">{{ emptyIcon }}</span>
        </template>
      </el-empty>
    </div>
    <template v-else>
      <div v-if="showToolbar" class="preview-toolbar">
        <slot name="toolbar-left" />
        <div class="toolbar-right">
          <el-button
            type="primary"
            size="small"
            :disabled="!isReplReady"
            @click="exportStaticHtml"
          >
            导出 HTML
          </el-button>
        </div>
      </div>
      <div class="repl-wrapper" :class="{ fullscreen }">
        <div v-if="!isReplReady" class="preview-loading">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>{{ loadingText }}</span>
        </div>
        <Repl
          v-show="isReplReady"
          :store="replStore"
          :editor="CodeMirror"
          :preview-options="previewOptions"
          :show-compile-output="false"
          :show-import-map="false"
          :show-ts-config="false"
          :clear-console="false"
          layout="vertical"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { Repl, useStore, useVueImportMap } from '@vue/repl'
import CodeMirror from '@vue/repl/codemirror-editor'
import { REPL_IMPORTS, buildPreviewHeadHTML } from '@/utils/repl-config'
import { buildReplFiles } from '@/utils/repl-files'
import { useExportHtml } from '@/composables/useExportHtml'
import type { ProjectFile } from '@/types'

const props = withDefaults(defineProps<{
  files: ProjectFile[]
  fullscreen?: boolean
  showToolbar?: boolean
  emptyText?: string
  emptyIcon?: string
  loadingText?: string
}>(), {
  fullscreen: false,
  showToolbar: false,
  emptyText: '没有可预览的文件',
  emptyIcon: '📄',
  loadingText: '加载预览中...',
})

const isReplReady = ref(false)
const hasFiles = computed(() => props.files.length > 0)

const { importMap: vueImportMap } = useVueImportMap()

const replStore = useStore({
  builtinImportMap: computed(() => ({
    imports: {
      ...vueImportMap.value.imports,
      ...REPL_IMPORTS,
    },
  })),
})

const previewOptions = {
  headHTML: buildPreviewHeadHTML(),
}

const { exportStaticHtml } = useExportHtml()

function syncFilesToRepl() {
  const newFiles = buildReplFiles(props.files)
  if (!newFiles) {
    isReplReady.value = false
    return
  }

  replStore.setFiles(newFiles, 'App.vue')
  isReplReady.value = true
}

let isMounted = true
onUnmounted(() => {
  isMounted = false
  isReplReady.value = false
})

watch(() => props.files, () => {
  if (!isMounted) return
  syncFilesToRepl()
}, { deep: true, immediate: true })

defineExpose({
  exportStaticHtml,
  isReplReady,
})
</script>

<style scoped>
.vue-repl-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.empty-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.repl-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.preview-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #fff;
  z-index: 10;
  color: #909399;
  font-size: 14px;
}

.preview-loading .el-icon {
  font-size: 24px;
}

.repl-wrapper :deep(.split-pane > .left),
.repl-wrapper :deep(.split-pane > .dragger) {
  display: none !important;
}

.repl-wrapper :deep(.split-pane > .right) {
  width: 100% !important;
  height: 100% !important;
}

.repl-wrapper :deep(.output-tabs),
.repl-wrapper :deep(.tab-buttons) {
  display: none !important;
}

.repl-wrapper :deep(.output-container) {
  height: 100% !important;
}
</style>
