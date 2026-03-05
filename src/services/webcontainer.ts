import { WebContainer } from '@webcontainer/api'

/**
 * WebContainer 管理服务
 * 负责创建、管理和与 WebContainer 交互
 */

let webcontainerInstance: WebContainer | null = null
let bootPromise: Promise<WebContainer> | null = null

/**
 * 获取或创建 WebContainer 实例
 */
export async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) {
    return webcontainerInstance
  }

  if (bootPromise) {
    return bootPromise
  }

  bootPromise = WebContainer.boot().then((instance) => {
    webcontainerInstance = instance
    return instance
  })

  return bootPromise
}

/**
 * 模板文件结构
 */
interface TemplateFiles {
  [path: string]: string
}

/**
 * 获取模板文件
 */
async function getTemplateFiles(templateName: string): Promise<TemplateFiles> {
  const templatePath = `/templates/${templateName}`

  // 基础模板文件列表
  const files: TemplateFiles = {}

  // 从 public/templates 加载文件
  const fileList = [
    'package.json',
    'vite.config.js',
    'index.html',
    'src/main.js',
    'src/App.vue',
    'src/Page.vue'
  ]

  for (const file of fileList) {
    try {
      const response = await fetch(`${templatePath}/${file}`)
      if (response.ok) {
        files[file] = await response.text()
      }
    } catch (e) {
      console.warn(`Failed to load template file: ${file}`, e)
    }
  }

  return files
}

/**
 * 初始化项目模板
 */
export async function initTemplate(
  container: WebContainer,
  templateName: string = 'element-plus',
  pageContent: string
): Promise<void> {
  // 获取模板文件
  const templateFiles = await getTemplateFiles(templateName)

  // 构建文件树
  const tree: Record<string, any> = {
    'package.json': {
      file: { contents: templateFiles['package.json'] }
    },
    'vite.config.js': {
      file: { contents: templateFiles['vite.config.js'] }
    },
    'index.html': {
      file: { contents: templateFiles['index.html'] }
    },
    src: {
      directory: {
        'main.js': {
          file: { contents: templateFiles['src/main.js'] }
        },
        'App.vue': {
          file: { contents: templateFiles['src/App.vue'] }
        },
        'Page.vue': {
          file: { contents: pageContent }
        }
      }
    }
  }

  // 挂载文件系统
  await container.mount(tree)
}

/**
 * 更新 Page.vue 内容
 */
export async function updatePageContent(
  container: WebContainer,
  content: string
): Promise<void> {
  await container.fs.writeFile('/src/Page.vue', content)
}

/**
 * 安装依赖
 */
export async function installDependencies(container: WebContainer): Promise<void> {
  const installProcess = await container.spawn('npm', ['install'])

  return new Promise((resolve, reject) => {
    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log('[npm install]', data)
        }
      })
    )

    installProcess.exit.then((code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`npm install failed with code ${code}`))
      }
    })
  })
}

/**
 * 启动开发服务器
 */
export async function startDevServer(
  container: WebContainer,
  onReady: (url: string) => void,
  onError: (error: string) => void
): Promise<void> {
  // 监听服务器就绪事件
  container.on('server-ready', (_port, url) => {
    console.log('[dev server] ready:', url)
    onReady(url)
  })

  container.on('error', ({ message }) => {
    console.error('[dev server] error:', message)
    onError(message)
  })

  // 启动 Vite 开发服务器
  const devProcess = await container.spawn('npm', ['run', 'dev'])

  devProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        console.log('[vite]', data)
      }
    })
  )

  devProcess.exit.then((code) => {
    console.log('[vite] exited with code:', code)
  })
}

/**
 * 销毁 WebContainer 实例
 */
export async function destroyWebContainer(): Promise<void> {
  if (webcontainerInstance) {
    // WebContainer 目前没有 destroy 方法，但我们清理引用
    webcontainerInstance = null
    bootPromise = null
  }
}

/**
 * 完整的预览初始化流程
 */
export async function initPreview(
  pageContent: string,
  templateName: string = 'element-plus',
  onProgress?: (message: string) => void
): Promise<{
  container: WebContainer
  url: string | null
}> {
  onProgress?.('正在初始化 WebContainer...')

  const container = await getWebContainer()

  onProgress?.('正在加载模板文件...')

  await initTemplate(container, templateName, pageContent)

  onProgress?.('正在安装依赖...')

  await installDependencies(container)

  return new Promise((resolve, reject) => {
    let resolved = false

    const timeout = setTimeout(() => {
      if (!resolved) {
        reject(new Error('Preview initialization timeout'))
      }
    }, 60000) // 60 seconds timeout

    onProgress?.('正在启动开发服务器...')

    startDevServer(
      container,
      (url) => {
        resolved = true
        clearTimeout(timeout)
        resolve({ container, url })
      },
      (error) => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          reject(new Error(error))
        }
      }
    )
  })
}
