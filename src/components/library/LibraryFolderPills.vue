<script setup lang="ts">
import type { LibraryFolder } from '@/types/models'

defineProps<{
  folders: LibraryFolder[]
  activeFolderId: string
}>()

const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <div class="folder-pills">
    <button
      type="button"
      class="folder-pills__item"
      :class="{ 'folder-pills__item--active': activeFolderId === 'all' }"
      @click="emit('select', 'all')"
    >
      All
    </button>
    <button
      v-for="folder in folders"
      :key="folder.id"
      type="button"
      class="folder-pills__item"
      :class="{ 'folder-pills__item--active': activeFolderId === folder.id }"
      @click="emit('select', folder.id)"
    >
      {{ folder.name }}
    </button>
  </div>
</template>

<style scoped>
.folder-pills {
  display: flex;
  gap: 0.55rem;
  overflow-x: auto;
  padding-bottom: 0.2rem;
}

.folder-pills__item {
  flex: 0 0 auto;
  border: 1px solid rgba(63, 76, 70, 0.14);
  border-radius: 999px;
  padding: 0.7rem 0.9rem;
  background: rgba(255, 255, 255, 0.8);
  color: var(--color-ink-muted);
  font: inherit;
}

.folder-pills__item--active {
  background: #1f3128;
  color: #f8f4ec;
}
</style>
