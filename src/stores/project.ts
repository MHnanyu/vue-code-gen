import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDebounceFn } from '@vueuse/core'

export const useProjectStore = defineStore('project', () => {
  // 核心状态：只存一个 Vue 组件代码
  const componentCode = ref('')
  const isModified = ref(false)
  const previewKey = ref(0) // 用于触发预览刷新

  // 是否有代码
  const hasCode = computed(() => componentCode.value.trim().length > 0)

  // 设置组件代码
  function setComponentCode(code: string) {
    componentCode.value = code
    isModified.value = false
    previewKey.value++ // 触发预览刷新
  }

  // 更新组件代码（来自编辑器修改）
  function updateComponentCode(code: string) {
    componentCode.value = code
    isModified.value = true
    // 防抖触发预览刷新
    debouncedRefreshPreview()
  }

  // 刷新预览
  function refreshPreview() {
    previewKey.value++
    isModified.value = false
  }

  // 防抖刷新（500ms）
  const debouncedRefreshPreview = useDebounceFn(refreshPreview, 500)

  // 清空项目
  function clearProject() {
    componentCode.value = ''
    isModified.value = false
    previewKey.value = 0
  }

  return {
    componentCode,
    isModified,
    previewKey,
    hasCode,
    setComponentCode,
    updateComponentCode,
    refreshPreview,
    clearProject,
  }
})
