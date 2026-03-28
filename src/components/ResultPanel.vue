<template>
  <div class="h-full flex flex-col bg-white">
    <div v-if="!hasFiles && !hasStageContent" class="flex-1 flex items-center justify-center">
      <el-empty description="生成代码后显示预览" :image-size="80">
        <template #image>
          <span class="text-5xl">🎨</span>
        </template>
      </el-empty>
    </div>
    <template v-else>
      <div class="flex justify-between items-center shrink-0 border-b border-gray-200 bg-white">
        <el-tabs v-model="activeTab" class="flex-1 result-tabs">
          <el-tab-pane label="Preview" name="preview" />
          <el-tab-pane label="Code" name="code" />
          <el-tab-pane v-if="hasStageContent" label="步骤产物" name="stages" />
        </el-tabs>
        <div v-if="activeTab !== 'stages'" class="flex gap-1 px-3 items-center">
          <div class="flex gap-1.5 mr-1.5 pr-2.5 border-r border-gray-200">
            <el-tag type="success" effect="plain" size="small">Vue3</el-tag>
            <el-tag effect="plain" size="small">{{ componentLibLabel }}</el-tag>
          </div>
          <el-tooltip content="全屏预览" placement="top">
            <el-button
              size="small"
              :disabled="!hasFiles"
              @click="goToFullscreenPreview"
            >
              <el-icon><FullScreen /></el-icon>
            </el-button>
          </el-tooltip>
          <el-button
            size="small"
            type="success"
            :loading="isSaving"
            :disabled="!projectStore.isModified"
            @click="handleSave"
          >
            保存并同步
          </el-button>
          <el-button
            size="small"
            type="primary"
            :disabled="!replPreviewRef?.isReplReady || activeTab !== 'preview'"
            @click="replPreviewRef?.exportStaticHtml()"
          >
            导出 HTML
          </el-button>
          <el-button
            size="small"
            type="warning"
            :disabled="!hasFiles"
            @click="exportProject"
          >
            导出项目
          </el-button>
        </div>
      </div>
      
      <VueReplPreview
        v-if="activeTab === 'preview'"
        ref="replPreviewRef"
        class="flex-1"
        :files="projectStore.files"
        :show-toolbar="false"
        empty-text="生成代码后显示预览"
        empty-icon="🎨"
        loading-text="加载预览中..."
      />
      
      <CodeEditorPanel v-else-if="activeTab === 'code'" />

      <StageOutputPanel
        v-show="activeTab === 'stages'"
        @has-stage-content-change="onHasStageContentChange"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { FullScreen } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import { useChatStore } from '@/stores/chat'
import { updateSessionFiles, type ApiFile } from '@/api'
import { collectAllFiles } from '@/utils/files'
import { downloadBlob } from '@/utils/download'
import { getBaseProjectFiles, getMainTs } from '@/templates/project-template'
import { getCcuiComponentsAsProjectFiles } from '@/templates/ccui-components'
import CodeEditorPanel from '@/components/CodeEditorPanel.vue'
import VueReplPreview from '@/components/VueReplPreview.vue'
import StageOutputPanel from '@/components/StageOutputPanel.vue'
import type { ProjectFile, ComponentLib } from '@/types'
import JSZip from 'jszip'

const router = useRouter()
const projectStore = useProjectStore()
const chatStore = useChatStore()
const activeTab = ref('preview')
const isSaving = ref(false)
const hasStageContent = ref(false)
const replPreviewRef = ref<InstanceType<typeof VueReplPreview> | null>(null)
const hasFiles = computed(() => projectStore.files.length > 0)

function onHasStageContentChange(val: boolean) {
  hasStageContent.value = val
}

const componentLibLabel = computed(() => {
  const session = chatStore.currentSession
  const lib = session?.componentLib || 'ElementUI'
  return COMPONENT_LIB_LABELS[lib] || 'ElementUI'
})

const COMPONENT_LIB_LABELS: Record<ComponentLib, string> = {
  ElementUI: 'ElementUI',
  aui: 'AUI',
  ccui: 'CcUI',
}

function collectEditableApiFiles(): ApiFile[] {
  const result: ApiFile[] = []

  function collect(files: ProjectFile[]) {
    for (const f of files) {
      if (f.type === 'file' && !f.readonly) {
        result.push({
          id: f.id,
          name: f.name,
          path: f.path,
          type: f.type,
          language: f.language,
          content: f.content,
        })
      }
      if (f.children) {
        collect(f.children)
      }
    }
  }

  collect(projectStore.files)
  return result
}

async function handleSave() {
  const sessionId = chatStore.currentSessionId
  if (!sessionId) {
    ElMessage.warning('没有活动的会话')
    return
  }

  isSaving.value = true
  try {
    const filesToSave = collectEditableApiFiles()
    await updateSessionFiles(sessionId, filesToSave)
    projectStore.clearModified()
    chatStore.updateSessionFiles(sessionId, filesToSave)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('Failed to save files:', error)
    ElMessage.error('保存失败')
  } finally {
    isSaving.value = false
  }
}

function goToFullscreenPreview() {
  const sessionId = chatStore.currentSessionId
  if (sessionId) {
    router.push({ path: '/preview', query: { sessionId } })
  }
}

watch(() => chatStore.activeStageTab, (key) => {
  if (key !== null && hasStageContent.value) {
    activeTab.value = 'stages'
  }
}, { flush: 'sync' })

watch(() => chatStore.currentSessionId, () => {
  if (activeTab.value === 'stages') {
    activeTab.value = 'preview'
  }
})

async function exportProject() {
  const componentLib = chatStore.currentSession?.componentLib || 'ElementUI'
  const zip = new JSZip()
  const baseFiles = getBaseProjectFiles(componentLib)

  const findFile = (name: string) => baseFiles.find(f => f.name === name)!

  zip.file('package.json', findFile('package.json').content)
  zip.file('vite.config.ts', findFile('vite.config.ts').content)
  zip.file('tsconfig.json', findFile('tsconfig.json').content)
  zip.file('index.html', findFile('index.html').content)

  const srcFolder = zip.folder('src')
  if (!srcFolder) {
    ElMessage.error('创建 src 目录失败')
    return
  }

  srcFolder.file('main.ts', getMainTs(componentLib))
  srcFolder.file('App.vue', findFile('App.vue').content)
  srcFolder.file('style.css', findFile('style.css').content)
  srcFolder.file('vite-env.d.ts', findFile('vite-env.d.ts').content)

  if (componentLib === 'ccui') {
    const ccuiFolder = srcFolder.folder('ccui')
    const ccuiComponents = getCcuiComponentsAsProjectFiles()

    function addCcuiFiles(files: ProjectFile[], parentFolder: JSZip) {
      for (const file of files) {
        if (file.type === 'folder' && file.children) {
          const subFolder = parentFolder.folder(file.name)
          if (subFolder) {
            addCcuiFiles(file.children, subFolder)
          }
        } else if (file.type === 'file' && file.content) {
          parentFolder.file(file.name, file.content)
        }
      }
    }

    addCcuiFiles(ccuiComponents, ccuiFolder!)
  }

  const allFiles = collectAllFiles(projectStore.files)
  const baseFileNames = baseFiles.map(f => f.name)
  const userFiles = allFiles.filter(f => 
    f.type === 'file' && 
    !f.readonly && 
    f.content &&
    !baseFileNames.includes(f.name) &&
    !f.path.includes('/ccui/')
  )

  for (const file of userFiles) {
    const filePath = file.path.startsWith('/') ? file.path.slice(1) : file.path
    if (filePath.startsWith('src/')) {
      srcFolder.file(filePath.replace('src/', ''), file.content!)
    } else {
      zip.file(filePath, file.content!)
    }
  }

  try {
    const blob = await zip.generateAsync({ type: 'blob' })
    downloadBlob(blob, 'vue-project.zip', 'application/zip')
    ElMessage.success('项目导出成功')
  } catch (error) {
    console.error('Export project failed:', error)
    ElMessage.error('导出项目失败')
  }
}
</script>

<style scoped>
.result-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 16px;
  border-bottom: none;
  background: transparent;
}

.result-tabs :deep(.el-tabs__content) {
  display: none;
}
</style>
