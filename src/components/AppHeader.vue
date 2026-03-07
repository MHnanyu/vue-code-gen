<template>
  <header class="flex justify-between items-center px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
    <div class="flex items-center gap-2 cursor-pointer" @click="$router.push('/')">
      <span class="text-2xl font-bold text-primary">V</span>
      <span class="font-semibold text-lg text-gray-700">Vue Code Gen</span>
    </div>
    
    <nav class="flex gap-6">
      <router-link 
        class="text-gray-500 font-medium py-2 border-b-2 border-transparent transition-all hover:text-primary"
        active-class="text-primary border-primary"
        to="/chat"
      >
        Chat
      </router-link>
      <router-link 
        class="text-gray-500 font-medium py-2 border-b-2 border-transparent transition-all hover:text-primary"
        active-class="text-primary border-primary"
        to="/generator"
      >
        Code Gen
      </router-link>
      <router-link 
        class="text-gray-500 font-medium py-2 border-b-2 border-transparent transition-all hover:text-primary"
        active-class="text-primary border-primary"
        to="/preview"
      >
        Preview
      </router-link>
      <router-link 
        class="text-gray-500 font-medium py-2 border-b-2 border-transparent transition-all hover:text-primary"
        active-class="text-primary border-primary"
        to="/ux-design"
      >
        UX Design
      </router-link>
    </nav>
  </header>
</template>

<script setup lang="ts">
</script>
