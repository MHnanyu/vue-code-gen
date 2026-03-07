<template>
  <div class="min-h-screen bg-gray-50">
    <AppHeader />
    <main class="min-h-[calc(100vh-60px)]">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
</script>
