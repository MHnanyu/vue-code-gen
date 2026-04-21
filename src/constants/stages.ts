export const STAGE_NAME_MAP: Record<string, string> = {
  attachment: '附件处理',
  requirement: '需求标准化',
  generation: '代码生成',
  optimization: 'UX 优化',
  iteration: '迭代修改',
  analyze_image: '分析设计稿图片',
  normalize_requirement: '需求标准化',
  query_ux_spec: '查询 UX 设计规范',
  search_component_doc: '查询组件文档',
  generate_vue_code: '生成 Vue 代码',
  optimize_ux: '优化 UX 样式',
  agent: 'Agent 执行',
}

export const INITIAL_STAGE_KEYS = ['attachment', 'requirement', 'generation', 'optimization']
