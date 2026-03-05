import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { ProjectFile } from '@/types'
import { createPreview } from '@/preview'

export const useProjectStore = defineStore('project', () => {
  const files = ref<ProjectFile[]>([])
  const selectedFileId = ref<string | null>(null)
  const previewHtml = ref('')
  const isPreviewLoading = ref(false)
  const previewError = ref<string | null>(null)
  const isModified = ref(false)

  const selectedFile = computed(() => findFileById(files.value, selectedFileId.value))

  function findFileById(files: ProjectFile[], id: string | null): ProjectFile | null {
    if (!id) return null
    for (const file of files) {
      if (file.id === id) return file
      if (file.children) {
        const found = findFileById(file.children, id)
        if (found) return found
      }
    }
    return null
  }

  function setFiles(newFiles: ProjectFile[]) {
    files.value = newFiles
    if (newFiles.length > 0 && !selectedFileId.value) {
      // 默认选中第一个文件
      const firstFile = findFirstFile(newFiles)
      if (firstFile) selectedFileId.value = firstFile.id
    }
    // 设置文件后立即生成预览
    generatePreview()
  }

  function findFirstFile(files: ProjectFile[]): ProjectFile | null {
    for (const file of files) {
      if (file.type === 'file') return file
      if (file.children) {
        const found = findFirstFile(file.children)
        if (found) return found
      }
    }
    return null
  }

  function selectFile(id: string) {
    selectedFileId.value = id
  }

  function updateFileContent(id: string, content: string) {
    const file = findFileById(files.value, id)
    if (file) {
      file.content = content
      isModified.value = true
      // 使用防抖更新预览（2秒延迟）
      debouncedGeneratePreview()
    }
  }

  function setPreviewHtml(html: string) {
    previewHtml.value = html
  }

  function clearProject() {
    files.value = []
    selectedFileId.value = null
    previewHtml.value = ''
    previewError.value = null
    isModified.value = false
    isPreviewLoading.value = false
  }

  // 生成预览（内部方法）
  function generatePreview() {
    if (files.value.length === 0) {
      previewHtml.value = ''
      return
    }

    try {
      isPreviewLoading.value = true
      previewError.value = null

      // 使用新的预览系统生成 HTML
      previewHtml.value = createPreview(files.value, {
        title: 'Vue3 Live Preview',
        autoDetectLibrary: true,
      })

      isModified.value = false
    } catch (error) {
      previewError.value = error instanceof Error ? error.message : 'Preview generation failed'
      console.error('Preview generation error:', error)
    } finally {
      isPreviewLoading.value = false
    }
  }

  // 防抖版本（2秒延迟）
  const debouncedGeneratePreview = useDebounceFn(generatePreview, 2000)

  // 立即重新生成预览（用于刷新按钮）
  function regeneratePreview() {
    generatePreview()
  }

  // 标记为已修改
  function markModified() {
    isModified.value = true
  }

  // 清除修改标记
  function clearModified() {
    isModified.value = false
  }

  // 设置预览错误
  function setPreviewError(error: string | null) {
    previewError.value = error
  }

  return {
    files,
    selectedFileId,
    previewHtml,
    isPreviewLoading,
    previewError,
    isModified,
    selectedFile,
    setFiles,
    selectFile,
    updateFileContent,
    setPreviewHtml,
    clearProject,
    regeneratePreview,
    markModified,
    clearModified,
    setPreviewError,
  }
})
