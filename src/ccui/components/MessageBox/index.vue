<script setup lang="ts">
import { ElMessageBox } from 'element-plus'

defineOptions({
  name: 'CcMessageBox'
})

// 封装 ElMessageBox 的各种方法
const messageBox = {
  /**
   * 确认消息框
   */
  alert: (message: string, title?: string, options?: any) => {
    return ElMessageBox.alert(message, title, options)
  },

  /**
   * 确认消息框 (带配置对象)
   */
  alertWithOptions: (options: any) => {
    return ElMessageBox.alert(options.message, options.title || '提示', options)
  },

  /**
   * 确认消息框 (简化调用)
   */
  confirm: (message: string, title?: string, options?: any) => {
    return ElMessageBox.confirm(message, title, options)
  },

  /**
   * 确认消息框 (带配置对象)
   */
  confirmWithOptions: (options: any) => {
    return ElMessageBox.confirm(options.message, options.title || '确认', options)
  },

  /**
   * 提示消息框
   */
  prompt: (message: string, title?: string, options?: any) => {
    return ElMessageBox.prompt(message, title, options)
  },

  /**
   * 提示消息框 (带配置对象)
   */
  promptWithOptions: (options: any) => {
    return ElMessageBox.prompt(options.message, options.title || '输入', options)
  },

  /**
   * 关闭消息框
   */
  close: () => {
    return ElMessageBox.close()
  }
}

// 导出 messageBox 实例
defineExpose(messageBox)
</script>

<template>
  <div class="cc-message-box-tip">
    <p>cc-message-box 是一个方法调用的组件，请通过以下方式使用：</p>
    <pre>import { CcMessageBox } from 'cc-ui'
CcMessageBox.alert('内容', '标题')
CcMessageBox.confirm('内容', '标题')
CcMessageBox.prompt('内容', '标题')</pre>
  </div>
</template>

<style scoped>
.cc-message-box-tip {
  padding: 20px;
  line-height: 2;
}
.cc-message-box-tip pre {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
