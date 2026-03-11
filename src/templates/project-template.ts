import type { ProjectFile, ComponentLib } from '@/types'
import { getCcuiComponentsAsProjectFiles, getCcuiThemeAsProjectFiles } from './ccui-components'

export function getMainTs(componentLib: ComponentLib = 'ElementUI'): string {
  if (componentLib === 'ccui') {
    return `import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './ccui/theme/tokens.css'
import './style.css'
import App from './App.vue'

import CcButton from './ccui/Button.vue'
import CcInput from './ccui/Input.vue'
import CcForm from './ccui/Form.vue'
import CcFormItem from './ccui/FormItem.vue'
import CcSelect from './ccui/Select.vue'
import CcOption from './ccui/Option.vue'
import CcCheckbox from './ccui/Checkbox.vue'
import CcCheckboxButton from './ccui/CheckboxButton.vue'
import CcCheckboxGroup from './ccui/CheckboxGroup.vue'
import CcRadio from './ccui/Radio.vue'
import CcSwitch from './ccui/Switch.vue'
import CcDatePicker from './ccui/DatePicker.vue'
import CcDateTimePicker from './ccui/DateTimePicker.vue'
import CcTimePicker from './ccui/TimePicker.vue'
import CcTimeSelect from './ccui/TimeSelect.vue'
import CcInputNumber from './ccui/InputNumber.vue'
import CcInputTag from './ccui/InputTag.vue'
import CcRate from './ccui/Rate.vue'
import CcSlider from './ccui/Slider.vue'
import CcColorPicker from './ccui/ColorPicker.vue'
import CcUpload from './ccui/Upload.vue'
import CcTransfer from './ccui/Transfer.vue'
import CcCascader from './ccui/Cascader.vue'
import CcTreeSelect from './ccui/TreeSelect.vue'
import CcAutocomplete from './ccui/Autocomplete.vue'
import CcMention from './ccui/Mention.vue'
import CcVirtualizedSelect from './ccui/VirtualizedSelect.vue'
import CcContainer from './ccui/Container.vue'
import CcContainerHeader from './ccui/ContainerHeader.vue'
import CcContainerAside from './ccui/ContainerAside.vue'
import CcContainerMain from './ccui/ContainerMain.vue'
import CcContainerFooter from './ccui/ContainerFooter.vue'
import CcLayoutRow from './ccui/LayoutRow.vue'
import CcLayoutCol from './ccui/LayoutCol.vue'
import CcSpace from './ccui/Space.vue'
import CcDivider from './ccui/Divider.vue'
import CcLink from './ccui/Link.vue'
import CcIcon from './ccui/Icon.vue'
import CcScrollbar from './ccui/Scrollbar.vue'
import CcAffix from './ccui/Affix.vue'
import CcAnchor from './ccui/Anchor.vue'
import CcResult from './ccui/Result.vue'
import CcDescriptions from './ccui/Descriptions.vue'
import CcDescriptionsItem from './ccui/DescriptionsItem.vue'
import CcEllipsis from './ccui/Ellipsis.vue'
import CcTypography from './ccui/Typography.vue'
import CcTypographyText from './ccui/TypographyText.vue'
import CcTypographyTitle from './ccui/TypographyTitle.vue'
import CcTypographyParagraph from './ccui/TypographyParagraph.vue'
import CcTypographyLink from './ccui/TypographyLink.vue'
import CcBorder from './ccui/Border.vue'
import CcColor from './ccui/Color.vue'
import CcOptionGroup from './ccui/OptionGroup.vue'

const app = createApp(App)
app.use(ElementPlus)

app.component('CcButton', CcButton)
app.component('CcInput', CcInput)
app.component('CcForm', CcForm)
app.component('CcFormItem', CcFormItem)
app.component('CcSelect', CcSelect)
app.component('CcOption', CcOption)
app.component('CcCheckbox', CcCheckbox)
app.component('CcCheckboxButton', CcCheckboxButton)
app.component('CcCheckboxGroup', CcCheckboxGroup)
app.component('CcRadio', CcRadio)
app.component('CcSwitch', CcSwitch)
app.component('CcDatePicker', CcDatePicker)
app.component('CcDateTimePicker', CcDateTimePicker)
app.component('CcTimePicker', CcTimePicker)
app.component('CcTimeSelect', CcTimeSelect)
app.component('CcInputNumber', CcInputNumber)
app.component('CcInputTag', CcInputTag)
app.component('CcRate', CcRate)
app.component('CcSlider', CcSlider)
app.component('CcColorPicker', CcColorPicker)
app.component('CcUpload', CcUpload)
app.component('CcTransfer', CcTransfer)
app.component('CcCascader', CcCascader)
app.component('CcTreeSelect', CcTreeSelect)
app.component('CcAutocomplete', CcAutocomplete)
app.component('CcMention', CcMention)
app.component('CcVirtualizedSelect', CcVirtualizedSelect)
app.component('CcContainer', CcContainer)
app.component('CcContainerHeader', CcContainerHeader)
app.component('CcContainerAside', CcContainerAside)
app.component('CcContainerMain', CcContainerMain)
app.component('CcContainerFooter', CcContainerFooter)
app.component('CcLayoutRow', CcLayoutRow)
app.component('CcLayoutCol', CcLayoutCol)
app.component('CcSpace', CcSpace)
app.component('CcDivider', CcDivider)
app.component('CcLink', CcLink)
app.component('CcIcon', CcIcon)
app.component('CcScrollbar', CcScrollbar)
app.component('CcAffix', CcAffix)
app.component('CcAnchor', CcAnchor)
app.component('CcResult', CcResult)
app.component('CcDescriptions', CcDescriptions)
app.component('CcDescriptionsItem', CcDescriptionsItem)
app.component('CcEllipsis', CcEllipsis)
app.component('CcTypography', CcTypography)
app.component('CcTypographyText', CcTypographyText)
app.component('CcTypographyTitle', CcTypographyTitle)
app.component('CcTypographyParagraph', CcTypographyParagraph)
app.component('CcTypographyLink', CcTypographyLink)
app.component('CcBorder', CcBorder)
app.component('CcColor', CcColor)
app.component('CcOptionGroup', CcOptionGroup)

app.mount('#app')
`
  }

  return `import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')
`
}

export const APP_VUE = `<template>
  <div id="app">
    <MainPage />
  </div>
</template>

<script setup lang="ts">
import MainPage from './MainPage.vue'
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
</style>
`

export const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue 3 App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`

export const PACKAGE_JSON = JSON.stringify({
  name: 'vue-generated-app',
  version: '0.1.0',
  scripts: {
    dev: 'vite',
    build: 'vue-tsc && vite build',
    preview: 'vite preview'
  },
  dependencies: {
    vue: '^3.5.0',
    'element-plus': '^2.9.0'
  },
  devDependencies: {
    '@vitejs/plugin-vue': '^6.0.0',
    tailwindcss: '^4.0.0',
    '@tailwindcss/vite': '^4.0.0',
    typescript: '^5.9.0',
    vite: '^7.0.0',
    'vue-tsc': '^3.0.0'
  }
}, null, 2)

export const VITE_CONFIG_TS = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
`

export const STYLE_CSS = `@import "tailwindcss";
`

export const TS_CONFIG = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
`

export const VITE_ENV_D_TS = `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
`

export function getBaseProjectFiles(componentLib: ComponentLib = 'ElementUI'): ProjectFile[] {
  return [
    {
      id: 'main-ts',
      name: 'main.ts',
      path: '/src/main.ts',
      type: 'file',
      language: 'typescript',
      content: getMainTs(componentLib),
      readonly: true
    },
    {
      id: 'app-vue',
      name: 'App.vue',
      path: '/src/App.vue',
      type: 'file',
      language: 'vue',
      content: APP_VUE,
      readonly: true
    },
    {
      id: 'style-css',
      name: 'style.css',
      path: '/src/style.css',
      type: 'file',
      language: 'css',
      content: STYLE_CSS,
      readonly: true
    },
    {
      id: 'vite-env-d-ts',
      name: 'vite-env.d.ts',
      path: '/src/vite-env.d.ts',
      type: 'file',
      language: 'typescript',
      content: VITE_ENV_D_TS,
      readonly: true
    },
    {
      id: 'index-html',
      name: 'index.html',
      path: '/index.html',
      type: 'file',
      language: 'html',
      content: INDEX_HTML,
      readonly: true
    },
    {
      id: 'package-json',
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      language: 'json',
      content: PACKAGE_JSON,
      readonly: true
    },
    {
      id: 'vite-config',
      name: 'vite.config.ts',
      path: '/vite.config.ts',
      type: 'file',
      language: 'typescript',
      content: VITE_CONFIG_TS,
      readonly: true
    },
    {
      id: 'tsconfig-json',
      name: 'tsconfig.json',
      path: '/tsconfig.json',
      type: 'file',
      language: 'json',
      content: TS_CONFIG,
      readonly: true
    }
  ]
}

export function buildProjectFiles(
  mainPageContent: string,
  extraComponents: ProjectFile[] = [],
  componentLib: ComponentLib = 'ElementUI'
): ProjectFile[] {
  const mainPageFile: ProjectFile = {
    id: 'main-page',
    name: 'MainPage.vue',
    path: '/src/MainPage.vue',
    type: 'file',
    language: 'vue',
    content: mainPageContent
  }

  const baseFiles = getBaseProjectFiles(componentLib)

  const srcChildren: ProjectFile[] = [
    baseFiles[0],
    baseFiles[1],
    baseFiles[2],
    baseFiles[3],
    mainPageFile,
    ...extraComponents
  ]

  if (componentLib === 'ccui') {
    const ccuiFiles = getCcuiComponentsAsProjectFiles()
    const ccuiThemeFiles = getCcuiThemeAsProjectFiles()
    const ccuiFolder = ccuiFiles[0]
    if (ccuiFolder.children) {
      ccuiFolder.children.push(...ccuiThemeFiles)
    }
    srcChildren.push(ccuiFolder)
  }

  const srcFolder: ProjectFile = {
    id: 'src-folder',
    name: 'src',
    path: '/src',
    type: 'folder',
    children: srcChildren
  }

  return [
    srcFolder,
    baseFiles[4],
    baseFiles[5],
    baseFiles[6],
    baseFiles[7]
  ]
}
