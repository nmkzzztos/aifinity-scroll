<script setup lang="ts">
import type { TopicSuggestion } from '@/types/models'

defineProps<{
  suggestions: TopicSuggestion[]
  selectedTitle: string
}>()

const emit = defineEmits<{
  select: [suggestion: TopicSuggestion]
}>()
</script>

<template>
  <div class="topic-grid">
    <button
      v-for="suggestion in suggestions"
      :key="suggestion.id"
      type="button"
      class="topic-grid__card"
      :class="{ 'topic-grid__card--active': selectedTitle === suggestion.title }"
      @click="emit('select', suggestion)"
    >
      <span class="topic-grid__title">{{ suggestion.title }}</span>
      <span class="topic-grid__subtitle">{{ suggestion.subtitle }}</span>
      <span class="topic-grid__why">{{ suggestion.whyNow }}</span>
      <span class="topic-grid__tags">
        <span v-for="tag in suggestion.subtopics" :key="tag" class="topic-grid__tag">{{ tag }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.topic-grid {
  display: grid;
  gap: 0.8rem;
}

.topic-grid__card {
  display: grid;
  gap: 0.55rem;
  border: 1px solid rgba(74, 92, 82, 0.18);
  border-radius: 1.4rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.78);
  text-align: left;
}

.topic-grid__card--active {
  border-color: rgba(31, 49, 40, 0.45);
  background: #eff1e9;
}

.topic-grid__title {
  font-family: var(--font-display);
  font-size: 1.15rem;
  line-height: 1.05;
}

.topic-grid__subtitle,
.topic-grid__why {
  color: var(--color-ink-muted);
}

.topic-grid__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.topic-grid__tag {
  border-radius: 999px;
  padding: 0.28rem 0.65rem;
  background: rgba(31, 49, 40, 0.08);
  font-size: 0.8rem;
}
</style>
