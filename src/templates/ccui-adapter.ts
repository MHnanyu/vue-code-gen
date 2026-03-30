import type { LibAdapter } from './lib-adapter'
import { registerLib } from './lib-adapter'
import { CCUI_COMPONENT_REGISTRY, getCcuiComponentsAsProjectFiles } from './ccui-components'

const ccuiAdapter: LibAdapter = {
  getMainTs() {
    const imports = CCUI_COMPONENT_REGISTRY
      .map(c => `import ${c.importName} from '${c.importPath}'`)
      .join('\n')
    const registrations = CCUI_COMPONENT_REGISTRY
      .map(c => `app.component('${c.regName}', ${c.importName})`)
      .join('\n')

    return `import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'

${imports}

const app = createApp(App)
app.use(ElementPlus)

${registrations}

app.mount('#app')
`
  },
  getExtraSrcChildren() {
    return getCcuiComponentsAsProjectFiles()
  },
}

registerLib('ccui', ccuiAdapter)
