import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ProjectFile } from '@/types'

export const useProjectStore = defineStore('project', () => {
  const files = ref<ProjectFile[]>([])
  const selectedFileId = ref<string | null>(null)
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
      const firstFile = findFirstFile(newFiles)
      if (firstFile) selectedFileId.value = firstFile.id
    }
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
    }
  }

  function clearProject() {
    files.value = []
    selectedFileId.value = null
    isModified.value = false
  }

  function markModified() {
    isModified.value = true
  }

  function clearModified() {
    isModified.value = false
  }

  return {
    files,
    selectedFileId,
    isModified,
    selectedFile,
    setFiles,
    selectFile,
    updateFileContent,
    clearProject,
    markModified,
    clearModified,
  }
})
