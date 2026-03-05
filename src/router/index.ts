import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: '首页' }
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/views/ChatView.vue'),
      meta: { title: 'AI对话' }
    },
    {
      path: '/generator',
      name: 'generator',
      component: () => import('@/views/GeneratorView.vue'),
      meta: { title: '代码生成' }
    },
    {
      path: '/preview',
      name: 'preview',
      component: () => import('@/views/PreviewView.vue'),
      meta: { title: 'HTML预览' }
    },
    {
      path: '/ux-design',
      name: 'ux-design',
      component: () => import('@/views/UxDesignView.vue'),
      meta: { title: 'UX设计' }
    }
  ]
})

export default router
