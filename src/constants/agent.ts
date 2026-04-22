export const AGENT_TOOL_LABELS: Record<string, string> = {
  analyze_image: '正在分析设计稿图片',
  normalize_requirement: '正在标准化需求',
  query_ux_spec: '正在查询 UX 设计规范',
  search_component_doc: '正在查询组件文档',
  generate_vue_code: '正在生成 Vue 代码',
  optimize_ux: '正在优化 UX 样式',
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen) + '...'
}

function pickFirst(args: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = args[key]
    if (typeof val === 'string' && val.trim()) return val.trim()
    if (typeof val === 'number') return String(val)
  }
  return ''
}

export function buildCallingLabel(toolName: string, arguments_?: string): string {
  const base = AGENT_TOOL_LABELS[toolName] || toolName
  if (!arguments_) return base

  try {
    const args = JSON.parse(arguments_)
    if (typeof args !== 'object' || args === null) return base

    switch (toolName) {
      case 'query_ux_spec': {
        const detail = pickFirst(args, [
          'query', 'spec_name', 'specName', 'component',
          'aspect', 'category', 'target', 'keywords', 'keyword',
        ])
        return detail ? `${base}：${truncate(detail, 40)}` : base
      }
      case 'search_component_doc': {
        const detail = pickFirst(args, [
          'query', 'component', 'component_name', 'componentName',
          'name', 'library', 'keywords', 'keyword',
        ])
        return detail ? `${base}：${truncate(detail, 40)}` : base
      }
      case 'generate_vue_code': {
        const detail = pickFirst(args, [
          'description', 'requirement', 'prompt', 'task',
          'page', 'feature', 'component',
        ])
        return detail ? `${base}：${truncate(detail, 30)}` : base
      }
      case 'optimize_ux': {
        const detail = pickFirst(args, [
          'description', 'target', 'aspect', 'focus',
          'suggestion', 'requirement',
        ])
        return detail ? `${base}：${truncate(detail, 30)}` : base
      }
      case 'analyze_image': {
        const detail = pickFirst(args, [
          'description', 'image_name', 'imageName', 'type',
          'analysis_target', 'target',
        ])
        return detail ? `${base}：${truncate(detail, 30)}` : base
      }
      case 'normalize_requirement': {
        const detail = pickFirst(args, [
          'requirement', 'description', 'raw_requirement',
          'prompt', 'task',
        ])
        return detail ? `${base}：${truncate(detail, 30)}` : base
      }
    }
  } catch {
    // arguments might not be valid JSON
  }

  return base
}

export function buildCompletedLabel(
  toolName: string,
  result?: Record<string, any>,
  message?: string,
  outputPaths?: string[] | null,
  _duration?: number,
): string {
  switch (toolName) {
    case 'query_ux_spec': {
      if (result) {
        const count =
          result.specs?.length ??
          result.rules?.length ??
          result.results?.length ??
          result.data?.length ??
          0
        if (count > 0) return `已查询 UX 规范，获取到 ${count} 条规范`
        const summary = result.summary || result.description || result.title
        if (summary) return `已查询 UX 规范：${truncate(summary, 40)}`
      }
      if (message) return message
      return `已查询 UX 设计规范`
    }
    case 'search_component_doc': {
      if (result) {
        const count =
          result.components?.length ??
          result.results?.length ??
          result.data?.length ??
          0
        if (count > 0) return `已查询组件文档，获取到 ${count} 个组件`
        const summary = result.summary || result.description || result.title
        if (summary) return `已查询组件文档：${truncate(summary, 40)}`
      }
      if (message) return message
      return `已查询组件文档`
    }
    case 'generate_vue_code': {
      const fileCount = outputPaths?.length ?? 0
      if (fileCount > 0) return `已生成 Vue 代码，共 ${fileCount} 个文件`
      if (message) return message
      return `已生成 Vue 代码`
    }
    case 'optimize_ux': {
      if (result?.summary) return `${result.summary}`
      if (message) return message
      return `已优化 UX 样式`
    }
    case 'analyze_image': {
      if (result?.summary) return `${result.summary}`
      if (message) return message
      return `已完成设计稿分析`
    }
    case 'normalize_requirement': {
      if (result?.summary) return `${result.summary}`
      if (message) return message
      return `已完成需求标准化`
    }
    default:
      return (AGENT_TOOL_LABELS[toolName]?.replace('正在', '已') || toolName)
  }
}

export function buildFailedLabel(toolName: string, error?: string): string {
  const base = AGENT_TOOL_LABELS[toolName]?.replace('正在', '') || toolName
  const reason = error ? `：${truncate(error, 50)}` : ''
  return `${base}失败${reason}`
}
