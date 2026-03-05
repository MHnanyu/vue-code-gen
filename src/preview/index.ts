// Preview System - Vue3 动态编译预览
//
// 功能：
// 1. 在浏览器中实时编译 Vue SFC
// 2. 支持 TypeScript
// 3. 支持组件库（Element Plus 等）
// 4. 在沙箱 iframe 中运行

import type { ProjectFile } from '@/types'
import { generatePreviewHtml, detectLibrary } from './generator'

export type { ProjectFile }
export { generatePreviewHtml, detectLibrary }

/**
 * 预览配置
 */
export interface PreviewOptions {
  title?: string
  library?: string
  autoDetectLibrary?: boolean
}

/**
 * 创建预览
 */
export function createPreview(files: ProjectFile[], options: PreviewOptions = {}): string {
  const {
    title = 'Vue3 Preview',
    library,
    autoDetectLibrary = true,
  } = options

  const detectedLibrary = autoDetectLibrary && !library
    ? detectLibrary(files)
    : library || 'element-plus'

  return generatePreviewHtml(files, {
    title,
    library: detectedLibrary,
  })
}

/**
 * 预览管理器 - 管理预览状态和生命周期
 */
export class PreviewManager {
  private iframe: HTMLIFrameElement | null = null
  private currentHtml: string = ''
  private refreshCallback: (() => void) | null = null
  private errorCallback: ((error: string) => void) | null = null

  /**
   * 设置 iframe 元素
   */
  setIframe(iframe: HTMLIFrameElement) {
    this.iframe = iframe
    this.setupMessageListener()
  }

  /**
   * 设置刷新回调
   */
  onRefresh(callback: () => void) {
    this.refreshCallback = callback
  }

  /**
   * 设置错误回调
   */
  onError(callback: (error: string) => void) {
    this.errorCallback = callback
  }

  /**
   * 设置消息监听
   */
  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'preview-error') {
        this.errorCallback?.(event.data.message)
      }
    })
  }

  /**
   * 更新预览
   */
  update(files: ProjectFile[], options: PreviewOptions = {}) {
    this.currentHtml = createPreview(files, options)
    this.render()
  }

  /**
   * 直接设置 HTML
   */
  setHtml(html: string) {
    this.currentHtml = html
    this.render()
  }

  /**
   * 渲染到 iframe
   */
  private render() {
    if (!this.iframe) return

    // 使用 srcdoc 属性设置内容
    this.iframe.srcdoc = this.currentHtml
  }

  /**
   * 刷新预览
   */
  refresh() {
    this.refreshCallback?.()
    this.render()
  }

  /**
   * 清空预览
   */
  clear() {
    this.currentHtml = ''
    if (this.iframe) {
      this.iframe.srcdoc = ''
    }
  }

  /**
   * 获取当前 HTML
   */
  getHtml(): string {
    return this.currentHtml
  }
}

// 默认导出
export default createPreview
