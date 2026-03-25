<template>
  <div class="app-root">
    <div class="aurora-bg"></div>
    <AppHeader />
    <main class="h-[calc(100vh-60px)] relative z-10 overflow-hidden">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
</script>

<style scoped>
.app-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%);
  position: relative;
  overflow: hidden;
}

.aurora-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40%;
  background: linear-gradient(
    180deg,
    rgba(238, 242, 255, 0.9) 0%,
    rgba(225, 232, 255, 0.7) 60%,
    transparent 100%
  );
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.aurora-bg::before {
  content: '';
  position: absolute;
  inset: -60px;
  background:
    radial-gradient(ellipse 600px 300px at 20% 40%, rgba(140, 130, 230, 0.25) 0%, transparent 70%),
    radial-gradient(ellipse 500px 250px at 60% 30%, rgba(100, 190, 220, 0.2) 0%, transparent 70%),
    radial-gradient(ellipse 400px 200px at 80% 60%, rgba(170, 140, 220, 0.18) 0%, transparent 70%);
  animation: auroraWave 4s ease-in-out infinite alternate;
}

.aurora-bg::after {
  content: '';
  position: absolute;
  inset: -60px;
  background:
    radial-gradient(ellipse 500px 200px at 30% 50%, rgba(200, 160, 210, 0.18) 0%, transparent 70%),
    radial-gradient(ellipse 450px 220px at 70% 25%, rgba(130, 175, 220, 0.2) 0%, transparent 70%);
  animation: auroraWave 5s ease-in-out infinite alternate-reverse;
}

@keyframes auroraWave {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
    opacity: 0.7;
  }
  33% {
    transform: translate(80px, -40px) scale(1.15) rotate(3deg);
    opacity: 1;
  }
  66% {
    transform: translate(-60px, 30px) scale(0.9) rotate(-2deg);
    opacity: 0.6;
  }
  100% {
    transform: translate(50px, -20px) scale(1.1) rotate(2deg);
    opacity: 0.85;
  }
}
</style>
