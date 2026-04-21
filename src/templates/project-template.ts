import type { ProjectFile, ComponentLib } from '@/types'
import {
  APP_VUE,
  INDEX_HTML,
  buildPackageJson,
  VITE_CONFIG_TS,
  STYLE_CSS,
  TS_CONFIG,
  VITE_ENV_D_TS,
  TAILWIND_CONFIG_TS,
  POSTCSS_CONFIG_JS,
} from './common'
import { getLibAdapter } from './lib-adapter'

import './element-ui'
import './ccui-adapter'

export {
  APP_VUE,
  INDEX_HTML,
  buildPackageJson,
  VITE_CONFIG_TS,
  STYLE_CSS,
  TS_CONFIG,
  VITE_ENV_D_TS,
  TAILWIND_CONFIG_TS,
  POSTCSS_CONFIG_JS,
}

export function getMainTs(componentLib: ComponentLib = 'ElementUI'): string {
  return getLibAdapter(componentLib).getMainTs()
}

export function getBaseProjectFiles(componentLib: ComponentLib = 'ElementUI'): ProjectFile[] {
  const adapter = getLibAdapter(componentLib)
  const packageJson = buildPackageJson(adapter.getDependencies())

  return [
    {
      id: 'main-ts',
      name: 'main.ts',
      path: '/src/main.ts',
      type: 'file',
      language: 'typescript',
      content: getMainTs(componentLib),
      readonly: true,
    },
    {
      id: 'app-vue',
      name: 'App.vue',
      path: '/src/App.vue',
      type: 'file',
      language: 'vue',
      content: APP_VUE,
      readonly: true,
    },
    {
      id: 'style-css',
      name: 'style.css',
      path: '/src/style.css',
      type: 'file',
      language: 'css',
      content: STYLE_CSS,
      readonly: true,
    },
    {
      id: 'vite-env-d-ts',
      name: 'vite-env.d.ts',
      path: '/src/vite-env.d.ts',
      type: 'file',
      language: 'typescript',
      content: VITE_ENV_D_TS,
      readonly: true,
    },
    {
      id: 'index-html',
      name: 'index.html',
      path: '/index.html',
      type: 'file',
      language: 'html',
      content: INDEX_HTML,
      readonly: true,
    },
    {
      id: 'package-json',
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      language: 'json',
      content: packageJson,
      readonly: true,
    },
    {
      id: 'vite-config',
      name: 'vite.config.ts',
      path: '/vite.config.ts',
      type: 'file',
      language: 'typescript',
      content: VITE_CONFIG_TS,
      readonly: true,
    },
    {
      id: 'tsconfig-json',
      name: 'tsconfig.json',
      path: '/tsconfig.json',
      type: 'file',
      language: 'json',
      content: TS_CONFIG,
      readonly: true,
    },
    {
      id: 'tailwind-config',
      name: 'tailwind.config.ts',
      path: '/tailwind.config.ts',
      type: 'file',
      language: 'typescript',
      content: TAILWIND_CONFIG_TS,
      readonly: true,
    },
    {
      id: 'postcss-config',
      name: 'postcss.config.js',
      path: '/postcss.config.js',
      type: 'file',
      language: 'javascript',
      content: POSTCSS_CONFIG_JS,
      readonly: true,
    },
  ]
}

export function buildProjectFiles(
  mainPageContent: string,
  extraComponents: ProjectFile[] = [],
  componentLib: ComponentLib = 'ElementUI'
): ProjectFile[] {
  const adapter = getLibAdapter(componentLib)
  const baseFiles = getBaseProjectFiles(componentLib)

  const mainPageFile: ProjectFile = {
    id: 'main-page',
    name: 'MainPage.vue',
    path: '/src/MainPage.vue',
    type: 'file',
    language: 'vue',
    content: mainPageContent,
  }

  const srcFiles = baseFiles.filter(f => f.path.startsWith('/src/'))
  const rootFiles = baseFiles.filter(f => !f.path.startsWith('/src/'))

  const srcFolder: ProjectFile = {
    id: 'src-folder',
    name: 'src',
    path: '/src',
    type: 'folder',
    children: [...srcFiles, mainPageFile, ...extraComponents, ...adapter.getExtraSrcChildren()],
  }

  return [srcFolder, ...rootFiles]
}
