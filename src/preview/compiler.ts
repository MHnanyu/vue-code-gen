import * as VueCompilerSFC from '@vue/compiler-sfc'

/**
 * Vue SFC 编译选项
 */
interface CompileOptions {
  filename?: string
  id?: string
}

/**
 * 编译 Vue SFC 文件
 */
export function compileVueSFC(source: string, options: CompileOptions = {}) {
  const { filename = 'Anonymous.vue', id = 'scope-id' } = options

  // 解析 SFC
  const { descriptor, errors } = VueCompilerSFC.parse(source, {
    filename,
  })

  if (errors.length > 0) {
    throw new Error(`Parse error: ${errors.map(e => e.message).join(', ')}`)
  }

  // 编译 script
  let scriptCode = ''
  if (descriptor.scriptSetup) {
    const compiled = VueCompilerSFC.compileScript(descriptor, {
      id,
      isProd: false,
      inlineTemplate: true,
    })
    scriptCode = compiled.content
  } else if (descriptor.script) {
    scriptCode = descriptor.script.content
  }

  // 如果没有内联模板，单独编译模板
  let templateCode = ''
  if (!descriptor.scriptSetup?.setup && descriptor.template) {
    const compiled = VueCompilerSFC.compileTemplate({
      source: descriptor.template.content,
      filename,
      id,
      isProd: false,
      compilerOptions: {
        isCustomElement: () => false,
      },
    })
    templateCode = compiled.code
  }

  // 提取样式
  const styles = descriptor.styles.map(style => ({
    code: style.content,
    scoped: style.scoped,
    module: style.module,
    lang: style.lang || 'css',
  }))

  return {
    script: scriptCode,
    template: templateCode,
    styles,
    descriptor,
  }
}

/**
 * 编译单个文件
 */
export function compileFile(content: string, language: string, _filename: string): {
  code: string
  styles: Array<{ code: string; scoped: boolean }>
} {
  switch (language) {
    case 'vue':
      const compiled = compileVueSFC(content)
      return {
        code: compiled.script || compiled.template,
        styles: compiled.styles.map(s => ({
          code: s.code,
          scoped: s.scoped || false,
        })),
      }
    case 'typescript':
    case 'javascript':
    case 'js':
      return {
        code: content,
        styles: [],
      }
    default:
      return {
        code: content,
        styles: [],
      }
  }
}
