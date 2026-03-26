<script setup lang="ts">
import type { FeedItem } from '@/types/models'
import { formatDate, joinList } from '@/utils/format'

defineProps<{
  item: FeedItem
}>()

const emit = defineEmits<{
  open: [id: string]
  like: [id: string]
  save: [id: string]
}>()
</script>

<template>
  <article class="feed-card">
    <div class="feed-card__meta">
      <span>{{ formatDate(item.createdAt) }}</span>
      <span>{{ item.estimatedReadMinutes }} min</span>
      <span>{{ item.tone }}</span>
    </div>
    <h2 class="feed-card__title">{{ item.title }}</h2>
    <section class="feed-card__block">
      <p class="feed-card__label">TL;DR</p>
      <p class="feed-card__summary">{{ item.tldr }}</p>
    </section>
    <section v-if="item.howItWorks.length" class="feed-card__block">
      <p class="feed-card__label">How it works</p>
      <ul class="feed-card__list">
        <li v-for="point in item.howItWorks" :key="point">{{ point }}</li>
      </ul>
    </section>
    <section class="feed-card__block">
      <p class="feed-card__label">Why it matters</p>
      <p class="feed-card__summary">{{ item.whyItMatters }}</p>
    </section>
    <p v-if="item.subtopics.length" class="feed-card__tags">{{ joinList(item.subtopics) }}</p>
    <div class="feed-card__actions">
      <button class="feed-card__button feed-card__button--primary" type="button" @click="emit('open', item.id)">
        Open
      </button>
      <button class="feed-card__button" type="button" @click="emit('like', item.id)">
        {{ item.liked ? 'Liked' : 'Like' }}
      </button>
      <button class="feed-card__button" type="button" @click="emit('save', item.id)">Save</button>
    </div>
  </article>
</template>

<style scoped>
.feed-card {
  display: grid;
  gap: 0.9rem;
  border: 1px solid rgba(78, 92, 84, 0.16);
  border-radius: 1.6rem;
  padding: 1.15rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(245, 242, 236, 0.9)),
    #fff;
  box-shadow: 0 10px 24px rgba(18, 24, 21, 0.05);
}

.feed-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  color: var(--color-ink-faint);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.feed-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.5rem;
  line-height: 0.96;
}

.feed-card__block {
  display: grid;
  gap: 0.35rem;
}

.feed-card__label {
  margin: 0;
  color: var(--color-ink-faint);
  font-size: 0.77rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.feed-card__summary,
.feed-card__tags {
  margin: 0;
  color: var(--color-ink-muted);
}

.feed-card__list {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--color-ink-muted);
}

.feed-card__actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
}

.feed-card__button {
  min-height: 2.85rem;
  border: 1px solid rgba(70, 82, 76, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--color-ink);
  font: inherit;
}

.feed-card__button--primary {
  background: #1f3128;
  color: #f7f3ea;
}
</style>
