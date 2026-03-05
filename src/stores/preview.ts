import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PreviewState {
  html: string
  css: string
  javascript: string
  viewport: 'desktop' | 'tablet' | 'mobile'
  zoom: number
}

export const usePreviewStore = defineStore('preview', () => {
  const html = ref('')
  const css = ref('')
  const javascript = ref('')
  const viewport = ref<PreviewState['viewport']>('desktop')
  const zoom = ref(1)
  const consoleOutput = ref<Array<{ type: 'log' | 'error' | 'warn'; message: string; timestamp: Date }>>([])

  const viewportWidth = computed(() => {
    switch (viewport.value) {
      case 'mobile': return 375
      case 'tablet': return 768
      case 'desktop': return 1280
    }
  })

  const combinedHtml = computed(() => {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
  <` + `/script>
</body>
</html>`
  })

  function setHtml(content: string) {
    html.value = content
  }

  function setCss(content: string) {
    css.value = content
  }

  function setJavascript(content: string) {
    javascript.value = content
  }

  function setViewport(newViewport: PreviewState['viewport']) {
    viewport.value = newViewport
  }

  function setZoom(newZoom: number) {
    zoom.value = Math.max(0.25, Math.min(2, newZoom))
  }

  function addConsoleOutput(type: 'log' | 'error' | 'warn', message: string) {
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
