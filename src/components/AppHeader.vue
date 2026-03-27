<template>
  <header class="relative z-10 flex justify-between items-center px-6 py-3 bg-transparent border-b border-transparent">
    <div class="flex items-center gap-2 cursor-pointer" @click="$router.push('/')">
      <span class="font-semibold text-lg bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Design AI</span>
    </div>
    
    <nav class="flex gap-6">
      <router-link
        class="text-gray-400 font-medium py-2 border-b-2 border-transparent transition-all hover:text-gray-600"
        active-class="text-gray-700 border-gray-400"
        to="/workspace"
        @click="handleWorkspaceClick"
      >
        工作台
      </router-link>
      <router-link 
        class="text-gray-400 font-medium py-2 border-b-2 border-transparent transition-all hover:text-gray-600"
        active-class="text-gray-700 border-gray-400"
        to="/playground"
      >
        演练场
      </router-link>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { useChatStore } from '@/stores/chat'

const chatStore = useChatStore()

function handleWorkspaceClick() {
  chatStore.currentSessionId = null
}
</script>
