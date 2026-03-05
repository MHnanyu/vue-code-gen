<template>
  <header class="app-header">
    <div class="logo" @click="$router.push('/')">
      <span class="logo-icon">V</span>
      <span class="logo-text">Vue Code Gen</span>
    </div>
    
    <nav class="nav-links">
      <router-link to="/generator">Code Gen</router-link>
      <router-link to="/preview">Preview</router-link>
      <router-link to="/ux-design">UX Design</router-link>
    </nav>
  </header>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: white;
  border-bottom: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.logo-icon {
  font-size: 1.5rem;
  font-weight: bold;
  color: #42b883;
}

.logo-text {
  font-weight: 600;
  font-size: 1.1rem;
  color: #35495e;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  color: #666;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.nav-links a:hover {
  color: #42b883;
}

.nav-links a.router-link-active {
  color: #42b883;
  border-bottom-color: #42b883;
}
</style>
