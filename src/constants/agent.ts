export const AGENT_TOOL_LABELS: Record<string, string> = {
  analyze_image: '正在分析设计稿图片',
  normalize_requirement: '正在标准化需求',
  query_ux_spec: '正在查询 UX 设计规范',
  search_component_doc: '正在查询组件文档',
  generate_vue_code: '正在生成 Vue 代码',
  optimize_ux: '正在优化 UX 样式',
}

export const AGENT_OUTPUT_URL_TOOLS = new Set([
  'normalize_requirement',
  'generate_vue_code',
  'optimize_ux',
])
