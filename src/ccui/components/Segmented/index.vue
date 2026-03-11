<template>
  <div
    class="cc-segmented"
    :class="[
      `cc-segmented--${size}`,
      {
        'cc-segmented--disabled': disabled,
        'cc-segmented--readonly': readonly,
        'cc-segmented--block': block
      }
    ]"
  >
    <div class="cc-segmented__group">
      <div
        v-for="(option, index) in options"
        :key="getOptionValue(option, index)"
        class="cc-segmented__item"
        :class="{
          'cc-segmented__item--selected': isSelected(getOptionValue(option, index))
        }"
        :style="getItemStyle(index)"
        @click="handleClick(getOptionValue(option, index), option)"
      >
        <span class="cc-segmented__item-text">
          <template v-if="slots.default">
            <slot :option="(option as SegmentedOption)" :index="index" />
          </template>
          <template v-else>
            {{ getOptionLabel(option) }}
          </template>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

interface SegmentedOption {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    options?: (SegmentedOption | string | number)[]
    size?: 'large' | 'default' | 'small'
    disabled?: boolean
    readonly?: boolean
    block?: boolean
  }>(),
  {
    modelValue: '',
    options: () => [],
    size: 'default',
    disabled: false,
    readonly: false,
    block: false
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number, option: SegmentedOption | string | number]
}>()

const slots = useSlots()

const selectedIndex = computed(() => {
  return props.options.findIndex(
    (option) => getOptionValue(option, 0) === props.modelValue
  )
})

const getOptionValue = (option: SegmentedOption | string | number, index: number): string | number => {
  if (typeof option === 'object') {
    return option.value
  }
  return option
}

const getOptionLabel = (option: SegmentedOption | string | number): string => {
  if (typeof option === 'object') {
    return option.label
  }
  return String(option)
}

const isSelected = (value: string | number): boolean => {
  return value === props.modelValue
}

const isDisabled = (option: SegmentedOption | string | number): boolean => {
  if (typeof option === 'object') {
    return option.disabled || props.disabled
  }
  return props.disabled
}

const getItemStyle = (index: number) => {
  if (selectedIndex.value === index && !props.disabled) {
    return {
      backgroundColor: 'var(--el-color-primary)'
    }
  }
  return {}
}

const handleClick = (value: string | number, option: SegmentedOption | string | number) => {
  if (props.disabled || props.readonly || isDisabled(option)) {
    return
  }
  
  if (value !== props.modelValue) {
    emit('update:modelValue', value)
    emit('change', value, option as SegmentedOption)
  }
}
</script>

<style scoped>
.cc-segmented {
  display: inline-flex;
  font-size: 14px;
}

.cc-segmented--block {
  width: 100%;
}

.cc-segmented--block .cc-segmented__group {
  width: 100%;
  flex: 1;
}

.cc-segmented--block .cc-segmented__item {
  flex: 1;
  justify-content: center;
}

.cc-segmented__group {
  display: inline-flex;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 2px;
  position: relative;
}

.cc-segmented__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  position: relative;
  z-index: 1;
  user-select: none;
  color: #606266;
}

.cc-segmented__item:hover:not(.cc-segmented__item--selected) {
  color: #409eff;
}

.cc-segmented__item--selected {
  color: #fff;
  font-weight: 500;
}

.cc-segmented__item-text {
  white-space: nowrap;
}

/* Size: large */
.cc-segmented--large {
  font-size: 16px;
}

.cc-segmented--large .cc-segmented__item {
  padding: 10px 20px;
}

/* Size: small */
.cc-segmented--small {
  font-size: 13px;
}

.cc-segmented--small .cc-segmented__item {
  padding: 6px 12px;
}

/* Disabled state */
.cc-segmented--disabled .cc-segmented__item,
.cc-segmented__item--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.cc-segmented--disabled .cc-segmented__item:hover {
  color: #606266;
}

.cc-segmented--disabled .cc-segmented__group {
  cursor: not-allowed;
}
</style>
