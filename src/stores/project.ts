import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ProjectFile } from '@/types'

export const useProjectStore = defineStore('project', () => {
  const files = ref<ProjectFile[]>([])
  const selectedFileId = ref<string | null>(null)
  const isModified = ref(false)

  const selectedFile = computed(() => findFileById(files.value, selectedFileId.value))

  const editableFiles = computed(() => filterEditableFiles(files.value))

  const readonlyFiles = computed(() => filterReadonlyFiles(files.value))

  function filterEditableFiles(fileList: ProjectFile[]): ProjectFile[] {
    return fileList
      .filter(f => !f.readonly)
      .map(f => ({
        ...f,
        children: f.children ? filterEditableFiles(f.children) : undefined
      }))
      .filter(f => f.type === 'file' || (f.children && f.children.length > 0))
  }

  function filterReadonlyFiles(fileList: ProjectFile[]): ProjectFile[] {
    return fileList
      .filter(f => f.readonly)
      .map(f => ({
        ...f,
        children: f.children ? filterReadonlyFiles(f.children) : undefined
      }))
      .filter(f => f.type === 'file' || (f.children && f.children.length > 0))
  }

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

  function addFile() {
    const id = crypto.randomUUID()
    const name = `NewFile_${Date.now()}.vue`
    const newFile: ProjectFile = {
      id,
      name,
      path: `/src/${name}`,
      type: 'file',
      content: '<template>\n  <div>\n    \n  </div>\n</template>\n\n<script setup lang="ts">\n\n</script>\n\n<style scoped>\n\n</style>\n',
      language: 'vue',
      readonly: false,
    }
    const srcFolder = files.value.find(f => f.path === '/src')
    if (srcFolder && srcFolder.children) {
      srcFolder.children.push(newFile)
    } else {
      files.value.push(newFile)
    }
    selectedFileId.value = id
    isModified.value = true
    return newFile
  }

  function deleteFile(id: string) {
    function removeFromList(list: ProjectFile[]): boolean {
      const index = list.findIndex(f => f.id === id)
      if (index !== -1) {
        list.splice(index, 1)
        return true
      }
      for (const f of list) {
        if (f.children && removeFromList(f.children)) {
          return true
        }
      }
      return false
    }
    
    removeFromList(files.value)
    if (selectedFileId.value === id) {
      selectedFileId.value = null
    }
    isModified.value = true
  }

  function renameFile(id: string, newName: string) {
    const file = findFileById(files.value, id)
    if (file) {
      file.name = newName
      const pathParts = file.path.split('/')
      pathParts[pathParts.length - 1] = newName
      file.path = pathParts.join('/')
      isModified.value = true
    }
  }

  return {
    files,
    selectedFileId,
    isModified,
    selectedFile,
    editableFiles,
    readonlyFiles,
    setFiles,
    selectFile,
    updateFileContent,
    clearProject,
    markModified,
    clearModified,
    addFile,
    deleteFile,
    renameFile,
  }
})
