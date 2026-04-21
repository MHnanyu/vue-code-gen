<script setup lang="ts">
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'CcMessage'
})

// 封装 ElMessage 的各种方法
const message = {
  /**
   * 显示成功消息
   */
  success: (message: string, options?: any) => {
    return ElMessage.success(message, options)
  },

  /**
   * 显示警告消息
   */
  warning: (message: string, options?: any) => {
    return ElMessage.warning(message, options)
  },

  /**
   * 显示错误消息
   */
  error: (message: string, options?: any) => {
    return ElMessage.error(message, options)
  },

  /**
   * 显示信息消息
   */
  info: (message: string, options?: any) => {
    return ElMessage.info(message, options)
  },

  /**
   * 通用消息方法
   */
  show: (message: string, options?: any) => {
    return ElMessage(message, options)
  },

  /**
   * 关闭所有消息
   */
  closeAll: () => {
    return ElMessage.closeAll()
  }
}

// 导出 message 实例
defineExpose(message)
</script>

<template>
  <div class="cc-message-tip">
    <p>cc-message 是一个方法调用的组件，请通过以下方式使用：</p>
    <pre>import { CcMessage } from 'cc-ui'
CcMessage.success('成功消息')
CcMessage.warning('警告消息')
CcMessage.error('错误消息')
CcMessage.info('信息消息')</pre>
  </div>
</template>

<style scoped>
.cc-message-tip {
  padding: 20px;
  line-height: 2;
}
.cc-message-tip pre {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
