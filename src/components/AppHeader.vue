<template>
  <header :class="isHome ? 'header-home' : 'header-page'">
    <div class="flex items-center gap-2 cursor-pointer" @click="$router.push('/')">
      <span class="logo-text">Design AI</span>
    </div>
    
    <nav class="flex gap-4">
      <router-link
        class="nav-link"
        :class="isHome ? 'nav-link-home' : 'nav-link-page'"
        :active-class="isHome ? 'nav-link-active-home' : 'nav-link-active'"
        to="/workspace"
        @click="handleWorkspaceClick"
      >
        工作台
      </router-link>
      <router-link 
        class="nav-link"
        :class="isHome ? 'nav-link-home' : 'nav-link-page'"
        :active-class="isHome ? 'nav-link-active-home' : 'nav-link-active'"
        to="/playground"
      >
        演练场
      </router-link>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chat'

const route = useRoute()
const chatStore = useChatStore()

const isHome = computed(() => route.path === '/')

function handleWorkspaceClick() {
  chatStore.currentSessionId = null
}
</script>

<style scoped>
.header-home {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 24px;
  pointer-events: auto;
}

.header-page {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 24px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e5e7eb;
}

.logo-text {
  font-weight: 600;
  font-size: 16px;
  background: linear-gradient(135deg, #6366f1, #a855f7, #6366f1, #a855f7);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 6s ease-in-out infinite;
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.nav-link {
  font-weight: 500;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  text-decoration: none;
  color: #9ca3af;
}

.nav-link-home {
  color: #6366f1;
}

.nav-link-home:hover {
  color: #4f46e5;
}

.nav-link-active-home {
  color: #4f46e5;
  border-color: #818cf8;
}

.nav-link-page:hover {
  color: #6b7280;
}

.nav-link-active {
  color: #374151;
  border-color: #d1d5db;
}
</style>
