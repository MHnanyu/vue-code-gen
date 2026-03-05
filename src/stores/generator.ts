import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface GeneratedFile {
  id: string
  filename: string
  content: string
  language: 'vue' | 'typescript' | 'javascript' | 'css' | 'html'
  createdAt: Date
}

export const useGeneratorStore = defineStore('generator', () => {
  const prompt = ref('')
  const generatedFiles = ref<GeneratedFile[]>([])
  const isGenerating = ref(false)
  const currentFile = ref<GeneratedFile | null>(null)
  const generationHistory = ref<Array<{ prompt: string; files: GeneratedFile[]; timestamp: Date }>>([])

  const hasFiles = computed(() => generatedFiles.value.length > 0)
  const fileCount = computed(() => generatedFiles.value.length)

  function setPrompt(newPrompt: string) {
    prompt.value = newPrompt
  }

  function addFile(file: GeneratedFile) {
    generatedFiles.value.push(file)
    currentFile.value = file
  }

  function removeFile(id: string) {
    const index = generatedFiles.value.findIndex(f => f.id === id)
    if (index > -1) {
      generatedFiles.value.splice(index, 1)
      if (currentFile.value?.id === id) {
        currentFile.value = generatedFiles.value[0] || null
      }
    }
  }

  function selectFile(id: string) {
    currentFile.value = generatedFiles.value.find(f => f.id === id) || null
  }

  function updateFileContent(id: string, content: string) {
    const file = generatedFiles.value.find(f => f.id === id)
    if (file) {
      file.content = content
    }
  }

  function clearFiles() {
    generatedFiles.value = []
    currentFile.value = null
  }

  function setGenerating(value: boolean) {
    isGenerating.value = value
  }

  function saveToHistory() {
    if (prompt.value && generatedFiles.value.length > 0) {
      generationHistory.value.unshift({
        prompt: prompt.value,
        files: [...generatedFiles.value],
        timestamp: new Date()
      })
      if (generationHistory.value.length > 20) {
        generationHistory.value.pop()
      }
    }
  }

  function loadFromHistory(index: number) {
    const entry = generationHistory.value[index]
    if (entry) {
      prompt.value = entry.prompt
      generatedFiles.value = [...entry.files]
      currentFile.value = entry.files[0] || null
    }
  }

  return {
    prompt,
    generatedFiles,
    isGenerating,
    currentFile,
    generationHistory,
    hasFiles,
    fileCount,
    setPrompt,
    addFile,
    removeFile,
    selectFile,
    updateFileContent,
    clearFiles,
    setGenerating,
    saveToHistory,
    loadFromHistory
  }
})
