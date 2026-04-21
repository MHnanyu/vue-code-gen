import { collectAllFiles } from '@/utils/files'
import type { ProjectFile } from '@/types'

export const SUPPORTED_REPL_EXTS = /\.(vue|ts|tsx|js|jsx)$/

export function normalizeImports(content: string, filename: string): string {
  let result = content

  if (filename === 'App.vue') {
    const scriptMatch = result.match(/(<script\s+setup[^>]*>)([\s\S]*?)(<\/script>)/)
    if (scriptMatch && !scriptMatch[2].includes('element-plus')) {
      const needsVueImports = []
      if (!scriptMatch[2].includes('getCurrentInstance')) needsVueImports.push('getCurrentInstance')

      const vueImport = needsVueImports.length > 0
        ? `import { ${needsVueImports.join(', ')} } from 'vue'\n`
        : ''

      const newScript = scriptMatch[1] +
        `\n${vueImport}import ElementPlus from 'element-plus'\n` +
        `const instance = getCurrentInstance()\n` +
        `const app = instance?.appContext.app\n` +
        `if (app && !app._elementPlusRegistered) {\n` +
        `  app.use(ElementPlus)\n` +
        `  app._elementPlusRegistered = true\n` +
        `}\n` +
        scriptMatch[2] +
        scriptMatch[3]
      result = result.replace(scriptMatch[0], newScript)
    }
  }

  result = result
    .replace(/^import\s+\*\s+as\s+echarts\s+from\s+['"]echarts['"]\s*;?\s*$/gm,
      `import * as _ec from 'echarts'; const echarts = {..._ec, init(...a){ const c=_ec.init(...a); requestAnimationFrame(()=>c.resize()); return c }}`)
    .replace(/^import\s+echarts\s+from\s+['"]echarts['"]\s*;?\s*$/gm,
      `import * as _ec from 'echarts'; const echarts = {..._ec, init(...a){ const c=_ec.init(...a); requestAnimationFrame(()=>c.resize()); return c }}`)
    .replace(/^import\s+['"][^'"]+\.css['"]\s*;?\s*$/gm, '')
    .replace(/(['"])@\/(?:[^'"]*\/)?([^/'"]+)\1/g, '$1./$2$1')
    .replace(/(['"])\.\.?\/(?:[^'"]*\/)?([^/'"]+\.(vue|ts|tsx|js|jsx))\1/g, '$1./$2$1')

  return result
}

export function generateAppVue(newFiles: Record<string, string>): string | null {
  const firstVueFile = Object.keys(newFiles).find(name =>
    name.endsWith('.vue') &&
    name !== 'App.vue' &&
    !name.startsWith('ccui/')
  )
  if (!firstVueFile) return null

  const componentName = firstVueFile.replace('.vue', '')

  const ccuiFiles = Object.keys(newFiles).filter(name => name.startsWith('ccui/') && name.endsWith('.vue'))
  const hasCcui = ccuiFiles.length > 0

  let ccuiImports = ''
  let ccuiRegisters = ''

  if (hasCcui) {
    const componentNames = ccuiFiles.map(f => {
      const baseName = f.replace('ccui/', '').replace('.vue', '')
      return { importName: `Cc${baseName}`, fileName: f, tagName: `Cc${baseName}` }
    })

    ccuiImports = componentNames.map(c => `import ${c.importName} from './${c.fileName}'`).join('\n') + '\n'
    ccuiRegisters = '\n' + componentNames.map(c => `app.component('${c.tagName}', ${c.importName})`).join('\n')
  }

  return `<template>
  <${componentName} />
</template>

<script setup>
import { getCurrentInstance } from 'vue'
import ${componentName} from './${firstVueFile}'
import ElementPlus from 'element-plus'
${ccuiImports}
const instance = getCurrentInstance()
const app = instance?.appContext.app
if (app) {
  if (!app._elementPlusRegistered) {
    app.use(ElementPlus)
    app._elementPlusRegistered = true
  }${ccuiRegisters}
}
<\/script>
`
}

export function buildReplFiles(files: ProjectFile[]): Record<string, string> | null {
  const allFiles = collectAllFiles(files)
  if (allFiles.length === 0) return null

  const newFiles: Record<string, string> = {}
  for (const f of allFiles) {
    if (!f.content || !SUPPORTED_REPL_EXTS.test(f.name)) continue
    const fileKey = f.path.startsWith('/src/') ? f.path.slice(5) : f.path.slice(1)
    newFiles[fileKey] = normalizeImports(f.content, f.name)
  }

  delete newFiles['App.vue']
  const appVueContent = generateAppVue(newFiles)
  if (!appVueContent) return null
  newFiles['App.vue'] = appVueContent

  return newFiles
}
