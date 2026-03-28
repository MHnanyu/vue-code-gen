<template>
  <header :class="isHome ? 'absolute top-0 left-0 right-0 z-20 flex justify-between items-center px-6 py-2 pointer-events-auto' : 'relative z-10 flex justify-between items-center px-6 py-2 bg-white/70 backdrop-blur-xl border-b border-gray-200'">
    <div class="flex items-center gap-2 cursor-pointer" @click="$router.push('/')">
      <span class="logo-text">Design AI</span>
    </div>
    
    <nav class="flex gap-4">
      <router-link
        class="font-medium py-1 border-b-2 border-transparent transition-all duration-200 no-underline"
        :class="isHome ? 'text-indigo-500 hover:text-indigo-600' : 'text-gray-400 hover:text-gray-500'"
        :active-class="isHome ? 'active-home' : 'active-page'"
        to="/workspace"
        @click="handleWorkspaceClick"
      >
        工作台
      </router-link>
      <router-link 
        class="font-medium py-1 border-b-2 border-transparent transition-all duration-200 no-underline"
        :class="isHome ? 'text-indigo-500 hover:text-indigo-600' : 'text-gray-400 hover:text-gray-500'"
        :active-class="isHome ? 'active-home' : 'active-page'"
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

.active-home {
  color: #4f46e5;
  border-color: #818cf8;
}

.active-page {
  color: #374151;
  border-color: #d1d5db;
}
</style>
