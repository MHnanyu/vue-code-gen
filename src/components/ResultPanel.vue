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
      <div class="toolbar">
        <el-tabs v-model="activeTab" class="result-tabs">
          <el-tab-pane label="Preview" name="preview" />
          <el-tab-pane label="Code" name="code" />
          <el-tab-pane v-if="hasStageContent" label="步骤产物" name="stages" />
        </el-tabs>
        <div v-if="activeTab !== 'stages'" class="toolbar-actions">
          <div class="tech-tags">
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
      
      <div v-else-if="activeTab === 'code'" class="code-editor-wrapper flex-1 flex">
        <div class="file-tree-panel">
          <FileTree
            :files="projectStore.files"
            :selected-file-id="projectStore.selectedFileId"
            @select="handleSelectFile"
            @add-file="handleAddFile"
            @delete="handleDeleteFile"
            @rename="handleRenameFile"
          />
        </div>
        <div class="editor-panel flex-1">
          <div v-if="selectedFile" class="editor-header">
            <span>{{ selectedFile.name }}</span>
            <el-tag v-if="selectedFile.readonly" size="small" type="info">只读</el-tag>
          </div>
          <MonacoEditor
            v-if="selectedFile"
            :value="selectedFile.content || ''"
            :language="selectedFile.language || 'typescript'"
            :readonly="selectedFile.readonly || false"
            @update:value="handleContentChange"
          />
          <el-empty v-else description="选择文件进行编辑" :image-size="60" />
        </div>
      </div>

      <div v-else-if="activeTab === 'stages'" class="stage-output-panel flex-1">
        <el-tabs v-model="activeStageKey" type="border-card" class="stage-tabs">
          <el-tab-pane
            v-for="stage in completedStages"
            :key="stage._key"
            :label="stage._label"
            :name="stage._key"
          >
            <div class="stage-content">
              <MarkdownPreview
                v-if="getStageOutputType(stage.stageName) === 'markdown'"
                :content="getStageMarkdownContent(stage._key)"
                :loading="stage.status === 'running'"
              />
              <VueReplPreview
                v-else-if="getStageOutputType(stage.stageName) === 'vue' && getStageVueFiles(stage._key)"
                class="stage-repl"
                :files="apiFilesToProjectFiles(getStageVueFiles(stage._key)!, chatStore.currentSession?.componentLib)"
                :show-toolbar="false"
                empty-text="暂无 Vue 产物"
                empty-icon="📄"
              />
              <el-empty v-else description="该步骤无可用预览" :image-size="60" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FullScreen } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import { useChatStore } from '@/stores/chat'
import { updateSessionFiles, fetchStageFile, fetchStageJson, type ApiFile } from '@/api'
import { collectAllFiles, apiFilesToProjectFiles } from '@/utils/files'
import { downloadBlob } from '@/utils/download'
import { STAGE_NAME_MAP, INITIAL_STAGE_KEYS } from '@/constants/stages'
import { getBaseProjectFiles, getMainTs } from '@/templates/project-template'
import { getCcuiComponentsAsProjectFiles } from '@/templates/ccui-components'
import FileTree from '@/components/FileTree.vue'
import MonacoEditor from '@/components/MonacoEditor.vue'
import VueReplPreview from '@/components/VueReplPreview.vue'
import MarkdownPreview from '@/components/MarkdownPreview.vue'
import type { ProjectFile, ComponentLib } from '@/types'
import JSZip from 'jszip'

const router = useRouter()
const projectStore = useProjectStore()
const chatStore = useChatStore()
const activeTab = ref('preview')
const activeStageKey = ref('')
const isSaving = ref(false)
const replPreviewRef = ref<InstanceType<typeof VueReplPreview> | null>(null)
const hasFiles = computed(() => projectStore.files.length > 0)
const selectedFile = computed(() => projectStore.selectedFile)

interface CompletedStage {
  _key: string
  _label: string
  stage: number
  stageName: string
  status: string
  duration: number | null
}

const completedStages = computed<CompletedStage[]>(() => {
  const result: CompletedStage[] = []

  const session = chatStore.currentSession
  const allOutputs = session ? session.messages.flatMap(m => m.stepMessages || []) : []

  const usedKeys = new Set<string>()
  const nameIndex = new Map<string, number>()
  const coveredStageNames = new Set<string>()
  for (const output of allOutputs) {
    nameIndex.set(output.stageName, (nameIndex.get(output.stageName) || 0) + 1)
    const baseName = STAGE_NAME_MAP[output.stageName] || output.stageName
    const isInitial = INITIAL_STAGE_KEYS.includes(output.stageName)
    const key = isInitial ? output.stageName : `${output.stageName}_${nameIndex.get(output.stageName)}`
    const label = isInitial ? baseName : `${baseName} #${nameIndex.get(output.stageName)}`
    if (usedKeys.has(key)) continue
    usedKeys.add(key)
    coveredStageNames.add(output.stageName)
    result.push({
      _key: key,
      _label: label,
      stage: output.stage,
      stageName: output.stageName,
      status: output.status,
      duration: output.duration,
    })
  }

  const showLiveTab = chatStore.isStreaming && (!chatStore.isRetrying || chatStore.retrySessionLoaded)

  if (showLiveTab) {
    const fromProgress = chatStore.stageProgresses.filter(s => s.status !== 'pending')
    const existingProgressNames = new Set<string>()
    for (const s of fromProgress) {
      if (existingProgressNames.has(s.stageName)) continue
      existingProgressNames.add(s.stageName)
      if (INITIAL_STAGE_KEYS.includes(s.stageName) && coveredStageNames.has(s.stageName)) continue
      const liveKey = `${s.stageName}_live`
      if (usedKeys.has(liveKey)) continue
      usedKeys.add(liveKey)
      result.push({
        _key: liveKey,
        _label: STAGE_NAME_MAP[s.stageName] || s.stageName,
        stage: s.stage,
        stageName: s.stageName,
        status: s.status,
        duration: s.duration,
      })
    }

    for (const [name, preview] of chatStore.stagePreviewMap) {
      if (!existingProgressNames.has(name) && preview.type) {
        if (!usedKeys.has(name)) {
          usedKeys.add(name)
          result.push({
            _key: name,
            _label: STAGE_NAME_MAP[name] || name,
            stage: -1,
            stageName: name,
            status: 'success',
            duration: null,
          })
        }
      }
    }
  }

  return result
})

const hasStageContent = computed(() => {
  return chatStore.isStreaming || completedStages.value.length > 0 || chatStore.hasStepMessages || stageContentCache.value.size > 0
})

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

const stageContentCache = ref<Map<string, { type: 'markdown' | 'vue' | null; content: string | null; files: ApiFile[] | null }>>(new Map())
const stageLoadingMap = ref<Map<string, boolean>>(new Map())

watch(() => chatStore.activeStageTab, async (key) => {
  if (key !== null && hasStageContent.value) {
    let target = completedStages.value.find(s => s._key === key)
    if (!target) {
      target = [...completedStages.value].reverse().find(s => s.stageName === key)
    }
    if (target) {
      activeTab.value = 'stages'
      activeStageKey.value = target._key
      await ensureStageContentLoaded(target._key)
    }
  }
}, { flush: 'sync' })

async function ensureStageContentLoaded(key: string) {
  if (stageContentCache.value.has(key)) return
  if (stageLoadingMap.value.get(key)) return

  const stage = completedStages.value.find(s => s._key === key)
  const stageName = stage?.stageName || key.replace(/_\d+$/, '').replace(/_live$/, '')
  if (!stageName) return

  if (key.endsWith('_live')) return

  let fetchPath: string | null = null
  let outputType: string | null = null

  const isDeduplicatedKey = /_\d+$/.test(key)

  const session = chatStore.currentSession
  if (session) {
    const outputs = session.messages.flatMap(m => m.stepMessages || [])
    if (isDeduplicatedKey) {
      const idx = parseInt(key.split('_').pop()!) - 1
      const sameNameOutputs = outputs.filter(o => o.stageName === stageName)
      const output = sameNameOutputs[idx]
      if (output) {
        fetchPath = output.filePath || null
        outputType = output.outputType || null
      }
    } else {
      const output = [...outputs].reverse().find(o => o.stageName === stageName)
      if (output) {
        fetchPath = output.filePath || null
        outputType = output.outputType || null
      }
    }
  }

  if (!fetchPath && !isDeduplicatedKey) {
    const preview = chatStore.stagePreviewMap.get(stageName)
    if (preview?.filePath && preview.type === 'markdown') {
      fetchPath = preview.filePath
      outputType = preview.type
    }
  }

  if (!fetchPath || !outputType) return

  stageLoadingMap.value.set(key, true)
  try {
    if (outputType === 'markdown') {
      const content = await fetchStageFile(fetchPath)
      stageContentCache.value.set(key, { type: 'markdown', content, files: null })
    } else if (outputType === 'vue' || outputType === 'json') {
      const raw = await fetchStageJson<ApiFile[] | { data?: ApiFile[]; files?: ApiFile[] }>(fetchPath)
      const data = Array.isArray(raw) ? raw : (raw.data || raw.files || [])
      stageContentCache.value.set(key, { type: 'vue', content: null, files: data })
    }
  } catch {
    console.warn('Failed to load stage artifact for', key)
  } finally {
    stageLoadingMap.value.set(key, false)
  }
}

watch(() => activeStageKey.value, async (key) => {
  if (key) {
    await ensureStageContentLoaded(key)
  }
})

watch(() => chatStore.hasStepMessages, async (has) => {
  if (has && activeStageKey.value) {
    if (activeStageKey.value.endsWith('_live')) {
      const stageName = activeStageKey.value.replace(/_live$/, '')
      const newTab = [...completedStages.value].reverse().find((s: CompletedStage) => s.stageName === stageName && !s._key.endsWith('_live'))
      if (newTab) {
        activeStageKey.value = newTab._key
        stageContentCache.value.clear()
        await ensureStageContentLoaded(newTab._key)
        return
      }
    }
    stageContentCache.value.clear()
    await ensureStageContentLoaded(activeStageKey.value)
  }
})

watch(() => chatStore.currentSessionId, () => {
  stageContentCache.value.clear()
  activeStageKey.value = ''
  if (activeTab.value === 'stages') {
    activeTab.value = 'preview'
  }
})

function getStageOutputType(stageName: string): 'markdown' | 'vue' | null {
  if (stageName === 'attachment' || stageName === 'requirement') return 'markdown'
  if (stageName === 'generation' || stageName === 'optimization' || stageName === 'iteration') return 'vue'
  return null
}

function getStageMarkdownContent(key: string): string | null {
  const cached = stageContentCache.value.get(key)
  if (cached?.type === 'markdown' && cached.content) {
    return cached.content
  }

  const stageName = completedStages.value.find(s => s._key === key)?.stageName
  if (!stageName) return null

  const preview = chatStore.stagePreviewMap.get(stageName)
  if (preview?.type === 'markdown' && preview.content) {
    return preview.content
  }

  return null
}

function getStageVueFiles(key: string): ApiFile[] | null {
  const cached = stageContentCache.value.get(key)
  if (cached?.type === 'vue' && cached.files) {
    return cached.files
  }

  const stageName = completedStages.value.find(s => s._key === key)?.stageName
  if (!stageName) return null

  const preview = chatStore.stagePreviewMap.get(stageName)
  if (preview?.type === 'vue' && preview.files) {
    return preview.files
  }

  return null
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

function handleSelectFile(file: ProjectFile) {
  projectStore.selectFile(file.id)
}

function handleAddFile() {
  projectStore.addFile()
}

async function handleDeleteFile(file: ProjectFile) {
  try {
    await ElMessageBox.confirm(`确定删除文件 "${file.name}" 吗？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    projectStore.deleteFile(file.id)
    ElMessage.success('文件已删除')
  } catch {
    // 用户取消
  }
}

function handleRenameFile(file: ProjectFile, newName: string) {
  projectStore.renameFile(file.id, newName)
}

function handleContentChange(content: string) {
  if (selectedFile.value && !selectedFile.value.readonly) {
    projectStore.updateFileContent(selectedFile.value.id, content)
  }
}

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
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.result-tabs {
  flex: 1;
}

.result-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 16px;
  border-bottom: none;
  background: transparent;
}

.result-tabs :deep(.el-tabs__content) {
  display: none;
}

.toolbar-actions {
  display: flex;
  gap: 4px;
  padding: 0 12px;
  align-items: center;
}

.tech-tags {
  display: flex;
  gap: 6px;
  margin-right: 6px;
  padding-right: 10px;
  border-right: 1px solid #e4e7ed;
}

.stage-output-panel {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.stage-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.stage-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.stage-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.stage-content {
  height: 100%;
  overflow: hidden;
}

.stage-repl {
  height: 100%;
}

.code-editor-wrapper {
  overflow: hidden;
}

.file-tree-panel {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  font-size: 13px;
}

.editor-panel :deep(.monaco-editor-container) {
  flex: 1;
}
</style>
