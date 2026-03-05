// 模拟生成的 Vue 组件代码
export function generateMockComponent(prompt: string): string {
  // 根据不同的 prompt 生成不同的组件
  const lowerPrompt = prompt.toLowerCase()

  if (lowerPrompt.includes('表单') || lowerPrompt.includes('form')) {
    return generateFormComponent(prompt)
  }

  if (lowerPrompt.includes('表格') || lowerPrompt.includes('table') || lowerPrompt.includes('列表')) {
    return generateTableComponent(prompt)
  }

  if (lowerPrompt.includes('登录') || lowerPrompt.includes('login')) {
    return generateLoginComponent(prompt)
  }

  if (lowerPrompt.includes('仪表盘') || lowerPrompt.includes('dashboard')) {
    return generateDashboardComponent(prompt)
  }

  // 默认生成一个通用组件
  return generateDefaultComponent(prompt)
}

// 生成表单组件
function generateFormComponent(_prompt: string): string {
  return `<template>
  <div class="form-container">
    <h2>用户信息表单</h2>
    <el-form :model="form" label-width="100px" style="max-width: 500px;">
      <el-form-item label="姓名">
        <el-input v-model="form.name" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.email" placeholder="请输入邮箱" />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="form.phone" placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio value="male">男</el-radio>
          <el-radio value="female">女</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="城市">
        <el-select v-model="form.city" placeholder="请选择城市">
          <el-option label="北京" value="beijing" />
          <el-option label="上海" value="shanghai" />
          <el-option label="广州" value="guangzhou" />
          <el-option label="深圳" value="shenzhen" />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const form = ref({
  name: '',
  email: '',
  phone: '',
  gender: 'male',
  city: '',
  remark: ''
})

function handleSubmit() {
  ElMessage.success('表单提交成功！')
  console.log('Form data:', form.value)
}

function handleReset() {
  form.value = {
    name: '',
    email: '',
    phone: '',
    gender: 'male',
    city: '',
    remark: ''
  }
}
</script>

<style scoped>
.form-container {
  padding: 40px;
  max-width: 600px;
  margin: 0 auto;
}

h2 {
  color: #303133;
  margin-bottom: 24px;
  text-align: center;
}
</style>`
}

// 生成表格组件
function generateTableComponent(_prompt: string): string {
  return `<template>
  <div class="table-container">
    <div class="table-header">
      <h2>数据列表</h2>
      <div class="table-actions">
        <el-input v-model="searchText" placeholder="搜索..." style="width: 200px;" clearable>
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" :icon="Plus">新增</el-button>
      </div>
    </div>
    <el-table :data="filteredData" stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div class="pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="100"
        :page-size="10"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchText = ref('')

const tableData = ref([
  { id: 1, name: '张三', email: 'zhangsan@example.com', status: 'active', createdAt: '2024-01-15' },
  { id: 2, name: '李四', email: 'lisi@example.com', status: 'inactive', createdAt: '2024-01-16' },
  { id: 3, name: '王五', email: 'wangwu@example.com', status: 'active', createdAt: '2024-01-17' },
  { id: 4, name: '赵六', email: 'zhaoliu@example.com', status: 'active', createdAt: '2024-01-18' },
  { id: 5, name: '孙七', email: 'sunqi@example.com', status: 'inactive', createdAt: '2024-01-19' },
])

const filteredData = computed(() => {
  if (!searchText.value) return tableData.value
  return tableData.value.filter(item =>
    item.name.includes(searchText.value) || item.email.includes(searchText.value)
  )
})

function handleEdit(row: any) {
  ElMessage.info(\`编辑: \${row.name}\`)
}

function handleDelete(row: any) {
  ElMessageBox.confirm(\`确定删除 \${row.name} 吗？\`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  })
}
</script>

<style scoped>
.table-container {
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h2 {
  margin: 0;
  color: #303133;
}

.table-actions {
  display: flex;
  gap: 12px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>`
}

// 生成登录组件
function generateLoginComponent(_prompt: string): string {
  return `<template>
  <div class="login-container">
    <div class="login-box">
      <h2>用户登录</h2>
      <el-form :model="loginForm" :rules="rules" ref="formRef" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="用户名" size="large">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="密码" size="large" show-password>
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <div class="login-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <el-link type="primary">忘记密码？</el-link>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" style="width: 100%;" @click="handleLogin" :loading="loading">
            登录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        <span>还没有账号？</span>
        <el-link type="primary">立即注册</el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const formRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = ref({
  username: '',
  password: ''
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('登录成功！')
  }, 1500)
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-box h2 {
  text-align: center;
  color: #303133;
  margin-bottom: 30px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  color: #909399;
}
</style>`
}

// 生成仪表盘组件
function generateDashboardComponent(_prompt: string): string {
  return `<template>
  <div class="dashboard">
    <h1>数据仪表盘</h1>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon" style="background: #409eff;">
          <el-icon size="24"><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.users }}</div>
          <div class="stat-label">总用户</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #67c23a;">
          <el-icon size="24"><ShoppingCart /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.orders }}</div>
          <div class="stat-label">订单数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #e6a23c;">
          <el-icon size="24"><Money /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">¥{{ stats.revenue }}</div>
          <div class="stat-label">总收入</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: #f56c6c;">
          <el-icon size="24"><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.growth }}%</div>
          <div class="stat-label">增长率</div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="section">
      <h3>最近活动</h3>
      <el-timeline>
        <el-timeline-item v-for="activity in activities" :key="activity.id" :timestamp="activity.time" placement="top">
          {{ activity.content }}
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { User, ShoppingCart, Money, TrendCharts } from '@element-plus/icons-vue'

const stats = ref({
  users: '12,345',
  orders: '8,234',
  revenue: '156,789',
  growth: '23.5'
})

const activities = ref([
  { id: 1, content: '用户 张三 完成了注册', time: '2024-01-20 10:30' },
  { id: 2, content: '订单 #12345 已发货', time: '2024-01-20 09:15' },
  { id: 3, content: '系统完成了数据备份', time: '2024-01-20 08:00' },
  { id: 4, content: '新增商品「智能手表」上架', time: '2024-01-19 16:45' },
])
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

h1 {
  color: #303133;
  margin-bottom: 24px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.section h3 {
  margin: 0 0 16px 0;
  color: #303133;
}
</style>`
}

// 生成默认组件
function generateDefaultComponent(prompt: string): string {
  return `<template>
  <div class="page-container">
    <div class="header">
      <h1>欢迎使用 Vue3 页面生成器</h1>
      <p class="subtitle">根据您的需求生成的页面</p>
    </div>

    <div class="content">
      <el-card class="prompt-card">
        <template #header>
          <span>您的需求</span>
        </template>
        <p class="prompt-text">{{ userPrompt }}</p>
      </el-card>

      <div class="demo-section">
        <h2>功能演示</h2>
        <div class="demo-buttons">
          <el-button type="primary" @click="count++">
            点击计数: {{ count }}
          </el-button>
          <el-button type="success" @click="showMessage('success')">
            成功消息
          </el-button>
          <el-button type="warning" @click="showMessage('warning')">
            警告消息
          </el-button>
          <el-button type="danger" @click="showMessage('error')">
            错误消息
          </el-button>
        </div>

        <div class="demo-form">
          <h3>表单示例</h3>
          <el-input v-model="inputValue" placeholder="输入一些内容..." style="width: 300px;" />
          <p v-if="inputValue">您输入了: {{ inputValue }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const userPrompt = ref('${prompt.replace(/'/g, "\\'")}')
const count = ref(0)
const inputValue = ref('')

function showMessage(type: 'success' | 'warning' | 'error') {
  const messages = {
    success: '操作成功！',
    warning: '请注意！',
    error: '出错了！'
  }
  ElMessage({ type, message: messages[type] })
}
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 20px;
  text-align: center;
}

.header h1 {
  margin: 0;
  font-size: 32px;
}

.subtitle {
  margin: 12px 0 0;
  opacity: 0.9;
}

.content {
  max-width: 800px;
  margin: -30px auto 0;
  padding: 0 20px 40px;
}

.prompt-card {
  margin-bottom: 24px;
}

.prompt-text {
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.demo-section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.demo-section h2 {
  margin: 0 0 20px;
  color: #303133;
}

.demo-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.demo-form h3 {
  margin: 0 0 12px;
  color: #303133;
}

.demo-form p {
  margin: 12px 0 0;
  color: #606266;
}
</style>`
}

// 模拟AI回复
export function generateMockAIResponse(userMessage: string): string {
  const responses = [
    `我理解您的需求："${userMessage.slice(0, 50)}..."。我已经为您生成了相应的 Vue3 组件代码，您可以在右侧的 "Code" 标签页查看和编辑代码。`,
    `根据您的要求，我已经生成了组件代码。您可以直接在代码编辑器中修改，预览会实时更新。`,
    `好的，代码已生成！您可以在 Code 标签页查看和编辑，在 Preview 标签页查看实时效果。`,
    `代码已更新完成！您可以编辑代码，预览会自动同步更新。如有任何问题，请告诉我。`
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

// 模拟API调用延迟
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
