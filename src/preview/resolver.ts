import type { ProjectFile } from '@/types'

// CDN 基础路径配置 - 使用 esm.sh 获得更好的 CORS 支持和 ESM 兼容性
const CDN_BASE = 'https://esm.sh'

// 支持的依赖库及其 CDN 路径
export const DEPENDENCIES: Record<string, { url: string; global?: string; css?: boolean }> = {
  // Vue 核心
  'vue': {
    url: `${CDN_BASE}/vue@3.5.13`,
    global: 'Vue',
  },

  // Element Plus
  'element-plus': {
    url: `${CDN_BASE}/element-plus@2.9.1`,
    global: 'ElementPlus',
  },
  'element-plus/': {
    url: `${CDN_BASE}/element-plus@2.9.1/`,
  },
  'element-plus/dist/index.css': {
    url: 'https://unpkg.com/element-plus@2.9.1/dist/index.css',
    css: true,
  },

  // Element Plus Icons
  '@element-plus/icons-vue': {
    url: `${CDN_BASE}/@element-plus/icons-vue@2.3.2`,
    global: 'ElementPlusIconsVue',
  },

  // Vue Router
  'vue-router': {
    url: `${CDN_BASE}/vue-router@4.6.4`,
    global: 'VueRouter',
  },

  // Pinia
  'pinia': {
    url: `${CDN_BASE}/pinia@3.0.4`,
    global: 'Pinia',
  },

  // @vueuse/core
  '@vueuse/core': {
    url: `${CDN_BASE}/@vueuse/core@11.0.0`,
    global: 'VueUse',
  },
}

/**
 * 生成 importmap 配置
 */
export function generateImportMap(customDeps?: Record<string, string>): string {
  const deps = { ...DEPENDENCIES }

  // 合并自定义依赖
  if (customDeps) {
    Object.entries(customDeps).forEach(([name, url]) => {
      deps[name] = { url }
    })
  }

  const imports: Record<string, string> = {}

  Object.entries(deps).forEach(([name, config]) => {
    if (!name.endsWith('/')) {
      imports[name] = config.url
    }
  })

  return JSON.stringify({ imports }, null, 2)
}

/**
 * 获取 CSS 链接
 */
export function getCSSLinks(): string[] {
  const cssLinks: string[] = []

  Object.entries(DEPENDENCIES).forEach(([_name, config]) => {
    if ('css' in config && config.css) {
      cssLinks.push(config.url)
    }
  })

  return cssLinks
}

/**
 * 解析文件路径
 */
export function resolvePath(importPath: string, currentFilePath: string, _files: ProjectFile[]): string | null {
  // 绝对路径（以 / 开头）
  if (importPath.startsWith('/')) {
    return importPath.slice(1) // 移除开头的 /
  }

  // @ 别名
  if (importPath.startsWith('@/')) {
    return importPath.slice(2) // 移除 @/
  }

  // 相对路径
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'))
    const parts = currentDir.split('/')
    const importParts = importPath.split('/')

    for (const part of importParts) {
      if (part === '..') {
        parts.pop()
      } else if (part !== '.') {
        parts.push(part)
      }
    }

    return parts.join('/')
  }

  // 外部依赖
  return null
}

/**
 * 查找文件
 */
export function findFile(path: string, allFiles: ProjectFile[]): ProjectFile | null {
  // 标准化路径
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path

  function search(items: ProjectFile[]): ProjectFile | null {
    for (const item of items) {
      // 检查路径匹配（移除开头的 /）
      const itemPath = item.path.startsWith('/') ? item.path.slice(1) : item.path

      if (itemPath === normalizedPath) {
        return item
      }

      // 尝试添加扩展名匹配
      if (item.type === 'file' && !item.path.includes('.')) {
        const extensions = ['.vue', '.ts', '.js', '.tsx', '.jsx']
        for (const ext of extensions) {
          if (itemPath + ext === normalizedPath) {
            return item
          }
        }
      }

      if (item.children) {
        const found = search(item.children)
        if (found) return found
      }
    }
    return null
  }

  return search(allFiles)
}

/**
 * 收集所有文件
 */
export function collectAllFiles(files: ProjectFile[]): ProjectFile[] {
  const result: ProjectFile[] = []

  function collect(items: ProjectFile[]) {
    for (const item of items) {
      if (item.type === 'file') {
        result.push(item)
      }
      if (item.children) {
        collect(item.children)
      }
    }
  }

  collect(files)
  return result
}

/**
 * 构建文件依赖图
 */
export function buildDependencyGraph(files: ProjectFile[]): Map<string, string[]> {
  const graph = new Map<string, string[]>()
  const allFiles = collectAllFiles(files)

  allFiles.forEach(file => {
    const deps: string[] = []
    const content = file.content || ''

    // 提取 import 语句
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g
    let match

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1]
      // 排除外部依赖
      if (!importPath.startsWith('@') || importPath.startsWith('@/')) {
        if (!DEPENDENCIES[importPath] && !DEPENDENCIES[importPath + '/']) {
          deps.push(importPath)
        }
      }
    }

    graph.set(file.path, deps)
  })

  return graph
}
