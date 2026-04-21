<template>
  <div class="cc-ellipsis" :style="containerStyle">
    <el-tooltip
      v-if="showTooltip && isEllipsis"
      :content="content"
      :placement="tooltipPlacement"
      :effect="tooltipEffect"
      :disabled="!showTooltip"
    >
      <span ref="textRef" :style="textStyle" class="cc-ellipsis__text">{{ displayContent }}</span>
    </el-tooltip>
    <span v-else ref="textRef" :style="textStyle" class="cc-ellipsis__text">{{ displayContent }}</span>
    <span v-if="expandable" class="cc-ellipsis__action" @click="toggleExpand">
      {{ expanded ? collapseText : expandText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'

defineOptions({
  name: 'CcEllipsis',
  inheritAttrs: false
})

interface Props {
  content?: string
  line?: number
  showTooltip?: boolean
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right'
  tooltipEffect?: 'dark' | 'light'
  expandable?: boolean
  expandText?: string
  collapseText?: string
  maxWidth?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  line: 1,
  showTooltip: true,
  tooltipPlacement: 'top',
  tooltipEffect: 'dark',
  expandable: false,
  expandText: '展开',
  collapseText: '收起',
  maxWidth: '100%'
})

const textRef = ref<HTMLElement | null>(null)
const expanded = ref(false)
const isEllipsis = ref(false)

const containerStyle = computed(() => ({
  maxWidth: typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth
}))

const textStyle = computed(() => {
  if (expanded.value) {
    return {}
  }
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: props.line,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordBreak: 'break-all'
  }
})

const displayContent = computed(() => props.content)

const toggleExpand = () => {
  expanded.value = !expanded.value
}

const checkEllipsis = () => {
  nextTick(() => {
    if (textRef.value) {
      isEllipsis.value = textRef.value.scrollWidth > textRef.value.clientWidth || 
                         textRef.value.scrollHeight > textRef.value.clientHeight
    }
  })
}

onMounted(() => {
  checkEllipsis()
})

watch(() => props.content, () => {
  checkEllipsis()
})

watch(() => props.line, () => {
  checkEllipsis()
})
</script>

<style scoped>
.cc-ellipsis {
  display: inline-flex;
  align-items: flex-start;
  width: 100%;
}

.cc-ellipsis__text {
  flex: 1;
  min-width: 0;
}

.cc-ellipsis__action {
  color: var(--el-color-primary);
  cursor: pointer;
  margin-left: 4px;
  flex-shrink: 0;
  font-size: inherit;
}

.cc-ellipsis__action:hover {
  color: var(--el-color-primary-light-3);
}
</style>
