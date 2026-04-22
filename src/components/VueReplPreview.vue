<template>
  <div class="h-full flex flex-col bg-white">
    <div v-if="!hasFiles" class="flex-1 flex items-center justify-center">
      <el-empty :description="emptyText" :image-size="80">
        <template #image>
          <span class="text-5xl">{{ emptyIcon }}</span>
        </template>
      </el-empty>
    </div>
    <template v-else>
      <div v-if="showToolbar" class="flex justify-between items-center px-4 py-2 border-b border-gray-200 shrink-0">
        <slot name="toolbar-left" />
        <div class="flex gap-2">
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
      <div class="repl-wrapper flex-1 overflow-hidden relative" :class="{ fullscreen }">
        <div v-if="!isReplReady" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white z-10 text-gray-400 text-sm">
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
import { ref, computed, watch, onUnmounted, shallowRef } from 'vue'
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

const filesSnapshot = shallowRef<string | null>(null)

function computeFilesSnapshot(): string {
  return props.files.map(f => `${f.path}::${(f.content || '')}`).join('\x00')
}

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

watch(computeFilesSnapshot, (newSnapshot) => {
  if (!isMounted) return
  filesSnapshot.value = newSnapshot
  syncFilesToRepl()
}, { immediate: true })

defineExpose({
  exportStaticHtml,
  isReplReady,
})
</script>

<style scoped>
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
