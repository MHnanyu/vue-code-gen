import * as VueCompilerSFC from '@vue/compiler-sfc'

// Vue SFC 编译选项
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
      inlineTemplate: true, // 内联模板以获得更好的性能
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
 * 简单的 TypeScript 转换（移除类型注解）
 * 对于复杂场景，应该使用 TypeScript Compiler API 或 esbuild-wasm
 */
export function stripTypes(code: string): string {
  // 这是一个简化的实现，仅处理常见情况
  // 生产环境建议使用 typescript compiler API 或 esbuild

  let result = code

  // 移除接口定义
  result = result.replace(/^interface\s+\w+(\s*<[^>]*>)?\s*\{[\s\S]*?\n\}/gm, '')

  // 移除类型定义
  result = result.replace(/^type\s+\w+(\s*<[^>]*>)?\s*=[\s\S]*?;\s*$/gm, '')

  // 移除函数参数类型注解
  result = result.replace(/\((\w+)\s*:\s*[^,)]+\)/g, '($1)')

  // 移除变量类型注解
  result = result.replace(/(\w+)\s*:\s*[^=;\n]+([=;\n])/g, '$1$2')

  // 移除泛型
  result = result.replace(/<[^>]+>/g, '')

  // 移除 as 类型断言
  result = result.replace(/\s+as\s+[^;,\n]+/g, '')

  // 移除 <script setup lang="ts"> 中的 lang 属性
  result = result.replace(/<script\s+setup\s+lang=["']ts["']\s*>/g, '<script setup>')

  return result
}

/**
 * 编译 TypeScript 代码
 */
export function compileTypeScript(code: string): string {
  // 简单方案：直接移除类型注解
  // 复杂方案需要使用 esbuild-wasm 或 TypeScript Compiler API
  return stripTypes(code)
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
      return {
        code: compileTypeScript(content),
        styles: [],
      }
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
