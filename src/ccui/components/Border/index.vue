<template>
  <div
    :class="borderClasses"
    :style="borderStyle"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  border?: boolean | string
  borderColor?: string
  borderWidth?: string
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none'
  borderRadius?: string | boolean
  shadow?: 'always' | 'hover' | 'never'
  padding?: string
  margin?: string
  width?: string
  height?: string
  round?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  border: true,
  borderColor: '#dcdfe6',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderRadius: '4px',
  shadow: 'never',
  padding: '20px',
  margin: '',
  width: '',
  height: '',
  round: false
})

const borderClasses = computed(() => {
  const classes = ['cc-border']
  
  if (props.shadow === 'always') {
    classes.push('cc-border--shadow-always')
  } else if (props.shadow === 'hover') {
    classes.push('cc-border--shadow-hover')
  }
  
  if (props.round) {
    classes.push('cc-border--round')
  }
  
  return classes
})

const borderStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.border === false) {
    style.border = 'none'
  } else if (typeof props.border === 'string') {
    style.border = props.border
  } else {
    style.border = `${props.borderWidth} ${props.borderStyle} ${props.borderColor}`
  }
  
  if (props.borderRadius) {
    if (typeof props.borderRadius === 'boolean') {
      style.borderRadius = props.borderRadius ? '4px' : '0'
    } else {
      style.borderRadius = props.borderRadius
    }
  }
  
  if (props.round) {
    style.borderRadius = '20px'
  }
  
  if (props.padding) {
    style.padding = props.padding
  }
  
  if (props.margin) {
    style.margin = props.margin
  }
  
  if (props.width) {
    style.width = props.width
  }
  
  if (props.height) {
    style.height = props.height
  }
  
  return style
})
</script>

<style scoped>
.cc-border {
  box-sizing: border-box;
  transition: box-shadow 0.3s;
}

.cc-border--shadow-always {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.cc-border--shadow-hover:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.cc-border--round {
  border-radius: 20px;
}
</style>
