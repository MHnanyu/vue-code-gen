<template>
  <div class="cc-color">
    <div v-if="showTitle" class="cc-color__title">{{ title }}</div>
    <div class="cc-color__content" :style="contentStyle">
      <div class="cc-color__preview" :style="previewStyle"></div>
      <div v-if="showInfo" class="cc-color__info">
        <div class="cc-color__name">{{ name }}</div>
        <div class="cc-color__value">{{ color }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  color: string
  name?: string
  title?: string
  size?: 'small' | 'default' | 'large'
  showInfo?: boolean
  showTitle?: boolean
  width?: string
  height?: string
  borderRadius?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: '#409eff',
  name: '',
  title: '',
  size: 'default',
  showInfo: true,
  showTitle: false,
  width: '',
  height: '',
  borderRadius: '4px'
})

const sizeMap = {
  small: { width: '100px', height: '40px' },
  default: { width: '150px', height: '60px' },
  large: { width: '200px', height: '80px' }
}

const previewStyle = computed(() => ({
  backgroundColor: props.color,
  borderRadius: props.borderRadius
}))

const contentStyle = computed(() => {
  const size = sizeMap[props.size]
  return {
    width: props.width || size.width,
    height: props.height || size.height
  }
})
</script>

<style scoped>
.cc-color {
  display: inline-flex;
  flex-direction: column;
}

.cc-color__title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.cc-color__content {
  display: flex;
  flex-direction: column;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
  background: #fff;
}

.cc-color__preview {
  flex: 1;
  transition: transform 0.2s;
}

.cc-color__preview:hover {
  transform: scale(1.02);
}

.cc-color__info {
  padding: 8px 12px;
  background: #fff;
  border-top: 1px solid #e4e7ed;
}

.cc-color__name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  margin-bottom: 4px;
}

.cc-color__value {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}
</style>
