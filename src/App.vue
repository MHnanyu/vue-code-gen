<template>
  <div class="app">
    <AppHeader />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
</script>

<style>
.app {
  min-height: 100vh;
  background: #f5f7fa;
}

.main-content {
  min-height: calc(100vh - 60px);
}
</style>
