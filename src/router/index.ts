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
      path: '/workspace',
      name: 'workspace',
      component: () => import('@/views/ChatView.vue'),
      meta: { title: '工作台' }
    },
    {
      path: '/playground',
      name: 'playground',
      component: () => import('@/views/PreviewView.vue'),
      meta: { title: '演练场' }
    }
  ]
})

export default router
