<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import BottomNav from '@/components/shared/BottomNav.vue'

const route = useRoute()
const showNav = computed(() => route.meta.showNav !== false)
</script>

<template>
  <div class="app-shell">
    <div class="app-shell__backdrop" />
    <main class="app-shell__main">
      <RouterView />
    </main>
    <BottomNav v-if="showNav" />
  </div>
</template>

<style scoped>
.app-shell {
  position: relative;
  min-height: 100vh;
  padding-bottom: calc(6rem + env(safe-area-inset-bottom));
}

.app-shell__backdrop {
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at top left, rgba(79, 117, 95, 0.16), transparent 28%),
    radial-gradient(circle at bottom right, rgba(33, 50, 44, 0.2), transparent 34%);
  pointer-events: none;
}

.app-shell__main {
  position: relative;
  z-index: 1;
}
</style>
