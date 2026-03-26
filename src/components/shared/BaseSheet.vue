<script setup lang="ts">
defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div v-if="open" class="sheet">
    <button class="sheet__scrim" type="button" aria-label="Close" @click="emit('close')" />
    <section class="sheet__panel" role="dialog" aria-modal="true" :aria-label="title">
      <header class="sheet__header">
        <h3 class="sheet__title">{{ title }}</h3>
        <button class="sheet__close" type="button" @click="emit('close')">Close</button>
      </header>
      <div class="sheet__body">
        <slot />
      </div>
    </section>
  </div>
</template>

<style scoped>
.sheet {
  position: fixed;
  inset: 0;
  z-index: 20;
}

.sheet__scrim {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(13, 18, 16, 0.42);
}

.sheet__panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 1.75rem 1.75rem 0 0;
  background: #fbf9f3;
  padding: 1.1rem 1rem calc(1.5rem + env(safe-area-inset-bottom));
  box-shadow: 0 -18px 34px rgba(17, 24, 21, 0.12);
}

.sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.sheet__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
}

.sheet__close {
  border: 0;
  background: transparent;
  color: var(--color-ink-muted);
  font: inherit;
}

.sheet__body {
  display: grid;
  gap: 1rem;
}
</style>
