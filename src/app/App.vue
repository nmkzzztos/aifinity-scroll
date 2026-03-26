<script setup lang="ts">
import AppShell from '@/app/AppShell.vue'
import { defineAsyncComponent } from 'vue'

/** Agentation is React-only; loaded in dev only via a small React mount. */
const AgentationHost = import.meta.env.DEV
  ? defineAsyncComponent(() => import('@/components/dev/AgentationHost.vue'))
  : null
</script>

<template>
  <AppShell />
  <component v-if="AgentationHost" :is="AgentationHost" />
</template>
