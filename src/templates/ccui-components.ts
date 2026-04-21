import type { ProjectFile } from '@/types'

const ccuiModules = import.meta.glob('../ccui/components/**/*.vue', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const NAME_OVERRIDES: Record<string, string> = {
  '../ccui/components/Layout/Row.vue': 'Row.vue',
  '../ccui/components/Layout/Col.vue': 'Col.vue',
  '../ccui/components/Menu/MenuItem.vue': 'MenuItem.vue',
  '../ccui/components/Menu/MenuItemGroup.vue': 'MenuItemGroup.vue',
  '../ccui/components/Menu/SubMenu.vue': 'SubMenu.vue',
}

function deriveOutputName(filePath: string): string {
  const override = NAME_OVERRIDES[filePath]
  if (override) return override

  const fileName = filePath.split('/').pop()!
  const parentDir = filePath.split('/').slice(-2, -1)[0]!

  if (fileName === 'index.vue') return `${parentDir}.vue`
  return `${parentDir}${fileName}`
}

interface CcuiComponentEntry {
  path: string
  name: string
  content: string
}

const CCUI_COMPONENT_ENTRIES: CcuiComponentEntry[] = Object.entries(ccuiModules)
  .map(([filePath, content]) => {
    const name = deriveOutputName(filePath)
    return { path: `ccui/${name}`, name, content }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

export function getCcuiComponentsAsProjectFiles(): ProjectFile[] {
  const ccuiFolder: ProjectFile = {
    id: 'ccui-folder',
    name: 'ccui',
    path: '/src/ccui',
    type: 'folder',
    children: CCUI_COMPONENT_ENTRIES.map((entry, index) => ({
      id: `ccui-${index}`,
      name: entry.name,
      path: `/src/${entry.path}`,
      type: 'file' as const,
      language: 'vue' as const,
      content: entry.content,
      readonly: true,
    })),
  }

  return [ccuiFolder]
}

export interface CcuiComponentReg {
  importPath: string
  importName: string
  regName: string
}

export const CCUI_COMPONENT_REGISTRY: CcuiComponentReg[] = CCUI_COMPONENT_ENTRIES.map(entry => {
  const baseName = entry.name.replace('.vue', '')
  return {
    importPath: `./${entry.path}`,
    importName: `Cc${baseName}`,
    regName: `Cc${baseName}`,
  }
})
