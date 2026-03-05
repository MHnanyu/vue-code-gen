import type { ProjectFile } from '@/types'

/**
 * 生成单个 Vue 组件代码
 * AI 只需要生成一个 Page.vue 组件
 */
export function generatePageComponent(prompt: string): string {
  // 根据不同的 prompt 生成不同的页面
  // 这里是示例实现，实际应该由 AI 生成

  // 检测是否包含特定关键词来生成不同的页面
  if (prompt.includes('表单') || prompt.includes('登录') || prompt.includes('注册')) {
    return generateFormPage(prompt)
  }

  if (prompt.includes('表格') || prompt.includes('列表') || prompt.includes('数据')) {
    return generateTablePage(prompt)
  }

  if (prompt.includes('仪表盘') || prompt.includes('dashboard') || prompt.includes('统计')) {
    return generateDashboardPage(prompt)
  }

  // 默认生成一个通用展示页面
  return generateDefaultPage(prompt)
}

/**
 * 生成表单页面
 */
function generateFormPage(_prompt: string): string {
  return `<template>
  <div class="page-container">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>用户登录</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="80px"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="formData.username"
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-checkbox v-model="formData.remember">记住我</el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading">
            登录
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const formRef = ref(null)
const loading = ref(false)

const formData = reactive({
  username: '',
  password: '',
  remember: false
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    // 模拟登录请求
    await new Promise(resolve => setTimeout(resolve, 1000))

    ElMessage.success('登录成功！')
    console.log('Login data:', formData)
  } catch (error) {
    console.error('Validation failed:', error)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  formRef.value?.resetFields()
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.form-card {
  width: 100%;
  max-width: 420px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.el-button + .el-button {
  margin-left: 12px;
}
</style>`
}

/**
 * 生成表格页面
 */
function generateTablePage(_prompt: string): string {
  return `<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据列表</span>
          <div class="header-actions">
            <el-input
              v-model="searchText"
              placeholder="搜索..."
              prefix-icon="Search"
              clearable
              style="width: 200px; margin-right: 12px"
            />
            <el-button type="primary" icon="Plus">新增</el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredData" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '活跃' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" type="primary" link>编辑</el-button>
            <el-button size="small" type="danger" link>删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(100)

// 模拟数据
const tableData = ref([
  { id: 1, name: '张三', email: 'zhangsan@example.com', status: 'active', createTime: '2024-01-15 10:30' },
  { id: 2, name: '李四', email: 'lisi@example.com', status: 'active', createTime: '2024-01-16 14:20' },
  { id: 3, name: '王五', email: 'wangwu@example.com', status: 'inactive', createTime: '2024-01-17 09:15' },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', status: 'active', createTime: '2024-01-18 16:45' },
  { id: 5, name: '孙七', email: 'sunqi@example.com', status: 'active', createTime: '2024-01-19 11:00' }
])

const filteredData = computed(() => {
  if (!searchText.value) return tableData.value
  const search = searchText.value.toLowerCase()
  return tableData.value.filter(item =>
    item.name.toLowerCase().includes(search) ||
    item.email.toLowerCase().includes(search)
  )
})
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>`
}

/**
 * 生成仪表盘页面
 */
function generateDashboardPage(_prompt: string): string {
  return `<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6" v-for="stat in stats" :key="stat.title">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon :size="24"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>访问趋势</span>
          </template>
          <div class="chart-placeholder">
            <el-icon :size="48" color="#409eff"><TrendCharts /></el-icon>
            <p>图表区域 - 可集成 ECharts</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>最新动态</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="activity in activities"
              :key="activity.id"
              :timestamp="activity.time"
              placement="top"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const stats = ref([
  { title: '总用户', value: '12,345', icon: 'User', color: '#409eff' },
  { title: '活跃用户', value: '8,234', icon: 'UserFilled', color: '#67c23a' },
  { title: '新增订单', value: '456', icon: 'ShoppingCart', color: '#e6a23c' },
  { title: '总收入', value: '¥89,432', icon: 'Money', color: '#f56c6c' }
])

const activities = ref([
  { id: 1, content: '用户 张三 完成了订单支付', time: '2024-01-20 10:30' },
  { id: 2, content: '新用户 李四 完成注册', time: '2024-01-20 09:15' },
  { id: 3, content: '系统完成了每日数据备份', time: '2024-01-20 08:00' },
  { id: 4, content: '管理员更新了系统配置', time: '2024-01-19 17:30' }
])
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.chart-row {
  margin-top: 20px;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.chart-placeholder p {
  margin-top: 12px;
}
</style>`
}

/**
 * 生成默认展示页面
 */
function generateDefaultPage(_prompt: string): string {
  return `<template>
  <div class="page-container">
    <el-card class="welcome-card">
      <div class="welcome-content">
        <el-icon :size="64" color="#409eff"><Promotion /></el-icon>
        <h1>Vue 3 页面生成器</h1>
        <p class="prompt-text">需求: {{ prompt }}</p>
        <el-button type="primary" size="large" @click="handleClick">
          开始体验
        </el-button>
      </div>
    </el-card>

    <el-row :gutter="20" class="feature-row">
      <el-col :span="8" v-for="feature in features" :key="feature.title">
        <el-card shadow="hover" class="feature-card">
          <el-icon :size="32" :color="feature.color">
            <component :is="feature.icon" />
          </el-icon>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.desc }}</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  prompt: {
    type: String,
    default: ''
  }
})

const prompt = ref(props.prompt || '请输入您的需求')

const features = ref([
  {
    title: '快速生成',
    desc: '基于 AI 技术，快速生成符合需求的 Vue 3 组件',
    icon: 'Lightning',
    color: '#409eff'
  },
  {
    title: '实时预览',
    desc: '代码修改后立即在预览窗口看到效果',
    icon: 'View',
    color: '#67c23a'
  },
  {
    title: '组件丰富',
    desc: '内置 Element Plus 组件库，满足各种 UI 需求',
    icon: 'Grid',
    color: '#e6a23c'
  }
])

const handleClick = () => {
  ElMessage.success('欢迎使用 Vue 3 页面生成器!')
}
</script>

<style scoped>
.page-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.welcome-card {
  margin-bottom: 20px;
}

.welcome-content {
  text-align: center;
  padding: 40px 20px;
}

.welcome-content h1 {
  margin: 20px 0;
  color: #303133;
  font-size: 28px;
}

.prompt-text {
  color: #606266;
  margin-bottom: 24px;
  padding: 12px 24px;
  background: #f5f7fa;
  border-radius: 4px;
  display: inline-block;
}

.feature-row {
  margin-top: 20px;
}

.feature-card {
  text-align: center;
  padding: 20px;
}

.feature-card h3 {
  margin: 16px 0 8px;
  color: #303133;
}

.feature-card p {
  color: #909399;
  font-size: 14px;
  line-height: 1.6;
}
</style>`
}

/**
 * 生成完整项目文件结构（保留用于代码展示）
 * 注意：实际预览使用 WebContainer，这里只是用于代码编辑器展示
 */
export function generateMockProject(prompt: string): ProjectFile[] {
  const pageContent = generatePageComponent(prompt)

  return [
    {
      id: '1',
      name: 'src',
      path: '/src',
      type: 'folder',
      children: [
        {
          id: '2',
          name: 'Page.vue',
          path: '/src/Page.vue',
          type: 'file',
          language: 'vue',
          content: pageContent
        },
        {
          id: '3',
          name: 'App.vue',
          path: '/src/App.vue',
          type: 'file',
          language: 'vue',
          content: `<template>
  <Page />
</template>

<script setup>
import Page from './Page.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>`
        },
        {
          id: '4',
          name: 'main.js',
          path: '/src/main.js',
          type: 'file',
          language: 'javascript',
          content: `import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'

const app = createApp(App)
app.use(ElementPlus)

// Register all Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')`
        }
      ]
    },
    {
      id: '5',
      name: 'index.html',
      path: '/index.html',
      type: 'file',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vue Preview</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>`
    },
    {
      id: '6',
      name: 'package.json',
      path: '/package.json',
      type: 'file',
      language: 'json',
      content: JSON.stringify({
        name: 'vue-preview-app',
        version: '0.0.1',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build'
        },
        dependencies: {
          vue: '^3.5.13',
          'element-plus': '^2.9.1',
          '@element-plus/icons-vue': '^2.3.2'
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^5.2.0',
          vite: '^6.0.0'
        }
      }, null, 2)
    }
  ]
}

// 模拟AI回复
export function generateMockAIResponse(userMessage: string): string {
  const responses = [
    `我理解您的需求："${userMessage.slice(0, 50)}..."。我已经为您生成了相应的 Vue 3 组件代码，您可以在右侧的"Code"标签页查看和编辑代码。`,
    `根据您的要求，我已经更新了页面组件。主要修改包括：\n1. 优化了组件结构\n2. 添加了新的功能模块\n3. 改进了样式设计`,
    `好的，我已根据您的反馈进行了调整。如果您还需要进一步的修改，请告诉我具体需求。`,
    `代码已更新完成！您可以在预览区域查看效果。如有任何问题，请随时告诉我。`
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

// 模拟API调用延迟
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
