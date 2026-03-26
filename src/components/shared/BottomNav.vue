<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const items = [
  { to: '/feed', label: 'Feed' },
  { to: '/library', label: 'Library' },
  { to: '/settings', label: 'Settings' },
]

const currentPath = computed(() => route.path)
</script>

<template>
  <nav class="bottom-nav" aria-label="Primary navigation">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="bottom-nav__link"
      :class="{ 'bottom-nav__link--active': currentPath.startsWith(item.to) }"
    >
      {{ item.label }}
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  right: 1rem;
  bottom: calc(1rem + env(safe-area-inset-bottom));
  left: 1rem;
  z-index: 10;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  border: 1px solid rgba(80, 93, 86, 0.2);
  border-radius: 1.5rem;
  padding: 0.55rem;
  background: rgba(248, 246, 240, 0.88);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 40px rgba(19, 22, 20, 0.12);
}

.bottom-nav__link {
  border-radius: 1.1rem;
  padding: 0.85rem 0.7rem;
  color: rgba(28, 34, 31, 0.72);
  text-align: center;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
}

.bottom-nav__link--active {
  background: #1f3128;
  color: #f8f4ec;
}
</style>
