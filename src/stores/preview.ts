import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PreviewState {
  html: string
  css: string
  javascript: string
  viewport: 'desktop' | 'tablet' | 'mobile'
  zoom: number
}

export interface ConsoleMessage {
  type: 'log' | 'error' | 'warn'
  message: string
  timestamp: Date
}

const VIEWPORT_WIDTHS: Record<PreviewState['viewport'], number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280
}

export const usePreviewStore = defineStore('preview', () => {
  const html = ref('')
  const css = ref('')
  const javascript = ref('')
  const viewport = ref<PreviewState['viewport']>('desktop')
  const zoom = ref(1)
  const consoleOutput = ref<ConsoleMessage[]>([])

  const viewportWidth = computed(() => VIEWPORT_WIDTHS[viewport.value])

  const combinedHtml = computed(() => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/element-plus/dist/index.css">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    ${css.value}
  </style>
</head>
<body>
  ${html.value}
  <script>
    try {
      ${javascript.value}
    } catch (e) {
      console.error(e.message);
    }
  \x3C/script>
</body>
</html>`)

  const setHtml = (content: string) => { html.value = content }
  const setCss = (content: string) => { css.value = content }
  const setJavascript = (content: string) => { javascript.value = content }
  const setViewport = (value: PreviewState['viewport']) => { viewport.value = value }
  const setZoom = (value: number) => { zoom.value = Math.max(0.25, Math.min(2, value)) }

  function addConsoleOutput(type: ConsoleMessage['type'], message: string) {
    consoleOutput.value.push({ type, message, timestamp: new Date() })
  }

  function clearConsole() {
    consoleOutput.value = []
  }

  function reset() {
    html.value = ''
    css.value = ''
    javascript.value = ''
    viewport.value = 'desktop'
    zoom.value = 1
    consoleOutput.value = []
  }

  return {
    html, css, javascript, viewport, zoom, consoleOutput,
    viewportWidth, combinedHtml,
    setHtml, setCss, setJavascript, setViewport, setZoom,
    addConsoleOutput, clearConsole, reset
  }
})
