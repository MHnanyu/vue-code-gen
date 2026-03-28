export const REPL_CDN_VERSIONS = {
  elementPlus: '2.4.4',
  elementPlusIcons: '2.3.1',
  echarts: '5.5.1',
} as const

export const REPL_IMPORTS: Record<string, string> = {
  'element-plus': `https://unpkg.com/element-plus@${REPL_CDN_VERSIONS.elementPlus}/dist/index.full.mjs`,
  '@element-plus/icons-vue': `https://unpkg.com/@element-plus/icons-vue@${REPL_CDN_VERSIONS.elementPlusIcons}/dist/index.js`,
  'echarts': `https://cdn.jsdelivr.net/npm/echarts@${REPL_CDN_VERSIONS.echarts}/dist/echarts.esm.min.js`,
}

export function buildPreviewHeadHTML(): string {
  const v = REPL_CDN_VERSIONS
  return `<link rel="stylesheet" href="https://unpkg.com/element-plus@${v.elementPlus}/dist/index.css">
<script src="https://cdn.tailwindcss.com"><\/script>
<style>
  blockquote {
    border-left: 4px solid #e5e7eb;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #6b7280;
  }
</style>
`
}
