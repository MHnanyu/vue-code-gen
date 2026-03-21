import type { ApiFile } from '@/api'
import type { ProjectFile, ComponentLib } from '@/types'
import { buildProjectFiles } from '@/templates/project-template'

export const SYSTEM_FILE_PATHS = new Set([
  '/src/main.ts',
  '/src/App.vue',
  '/src/style.css',
  '/public/index.html',
  '/package.json',
  '/vite.config.ts',
])

export function filterUserFiles(files: ApiFile[]): ApiFile[] {
  return files.filter(f => !SYSTEM_FILE_PATHS.has(f.path))
}

export function apiFilesToProjectFiles(
  apiFiles: ApiFile[],
  componentLib?: ComponentLib,
): ProjectFile[] {
  const userFiles = filterUserFiles(apiFiles)
  const mainPageContent = userFiles[0]?.content || ''
  const extraFiles: ProjectFile[] = userFiles.slice(1).map(f => ({
    id: f.id,
    name: f.name,
    path: f.path,
    type: f.type as 'file',
    language: f.language as ProjectFile['language'],
    content: f.content,
  }))
  return buildProjectFiles(mainPageContent, extraFiles, componentLib)
}

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
