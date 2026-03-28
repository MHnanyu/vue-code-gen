import { ElMessage } from 'element-plus'
import { downloadBlob } from '@/utils/download'

const REPL_WRAPPER_SELECTOR = '.repl-wrapper'

export function useExportHtml() {
  function exportStaticHtml() {
    const replWrapper = document.querySelector(REPL_WRAPPER_SELECTOR)
    if (!replWrapper) {
      ElMessage.warning('预览区域未找到')
      return
    }

    const iframe = replWrapper.querySelector('iframe') as HTMLIFrameElement
    if (!iframe) {
      ElMessage.warning('预览 iframe 未找到')
      return
    }

    try {
      const innerDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!innerDoc) {
        ElMessage.warning('无法访问预览内容')
        return
      }

      const htmlContent = innerDoc.documentElement.outerHTML
      downloadBlob(htmlContent, 'exported-page.html')
      ElMessage.success('导出成功')
    } catch (error) {
      console.error('Export failed:', error)
      ElMessage.error('导出失败，可能是跨域限制')
    }
  }

  return { exportStaticHtml }
}
