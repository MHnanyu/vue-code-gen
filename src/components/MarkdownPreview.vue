<template>
  <div class="markdown-preview">
    <el-skeleton v-if="loading" :rows="8" animated />
    <div v-else-if="content" class="markdown-body" v-html="renderedContent" />
    <el-empty v-else description="暂无预览内容" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { marked } from 'marked'

const props = defineProps<{
  content: string | null
  loading?: boolean
}>()

const renderedContent = computed(() => {
  if (!props.content) return ''
  return marked.parse(props.content)
})
</script>

<style scoped>
.markdown-preview {
  padding: 16px;
  overflow-y: auto;
  height: 100%;
}

.markdown-body {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
}

.markdown-body :deep(h1) {
  font-size: 20px;
  margin: 16px 0 8px;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

.markdown-body :deep(h2) {
  font-size: 17px;
  margin: 14px 0 6px;
  font-weight: 600;
}

.markdown-body :deep(h3) {
  font-size: 15px;
  margin: 12px 0 4px;
  font-weight: 600;
}

.markdown-body :deep(p) {
  margin: 8px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 20px;
  margin: 8px 0;
}

.markdown-body :deep(li) {
  margin: 4px 0;
}

.markdown-body :deep(code) {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #c7254e;
}

.markdown-body :deep(pre) {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 12px 0;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding: 8px 16px;
  margin: 12px 0;
  background: #ecf5ff;
  color: #606266;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid #ebeef5;
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: #f5f7fa;
  font-weight: 600;
}
</style>
