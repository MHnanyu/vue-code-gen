import type { LibAdapter } from './lib-adapter'
import { registerLib } from './lib-adapter'

const elementUIAdapter: LibAdapter = {
  getMainTs() {
    return `import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './style.css'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')
`
  },
  getExtraSrcChildren() {
    return []
  },
}

registerLib('ElementUI', elementUIAdapter)
registerLib('aui', elementUIAdapter)
