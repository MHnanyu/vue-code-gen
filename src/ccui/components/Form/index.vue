<template>
  <el-form ref="formRef" v-bind="$attrs">
    <slot></slot>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineOptions({
  name: 'CcForm'
})

const formRef = ref()

defineExpose({
  /**
   * 验证表单
   */
  validate: () => formRef.value?.validate(),
  /**
   * 验证指定字段
   */
  validateField: (prop: string) => formRef.value?.validateField(prop),
  /**
   * 清除验证
   */
  clearValidate: (props?: string | string[]) => formRef.value?.clearValidate(props),
  /**
   * 重置表单
   */
  resetFields: () => formRef.value?.resetFields()
})
</script>
