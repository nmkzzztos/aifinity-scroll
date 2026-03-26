<script setup lang="ts">
import { computed, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import FeedCard from '@/components/feed/FeedCard.vue'
import SaveArticleSheet from '@/components/feed/SaveArticleSheet.vue'
import LoadingBlock from '@/components/shared/LoadingBlock.vue'
import { useFeedGenerator } from '@/composables/useFeedGenerator'
import { useFeedStore } from '@/stores/feed'
import { useProfileStore } from '@/stores/profile'
import type { FeedItem } from '@/types/models'
import { LANGUAGE_PRESETS } from '@/utils/constants'

const router = useRouter()
const feedStore = useFeedStore()
const profileStore = useProfileStore()
const { generateFeedBatch } = useFeedGenerator()

const isInitialLoading = shallowRef(false)
const isLoadingMore = shallowRef(false)
const error = shallowRef('')
const activeSaveItem = shallowRef<FeedItem | null>(null)
const topicDraft = shallowRef(profileStore.activeTopic)
const feedSessionId = shallowRef(0)

const sentinel = useTemplateRef<HTMLDivElement>('sentinel')

const languagePreset = computed(
  () => {
    const preset =
      LANGUAGE_PRESETS.find((entry) => entry.id === profileStore.languagePresetId) ?? LANGUAGE_PRESETS[0]

    return profileStore.customLanguageNote
      ? {
          ...preset,
          instruction: `${preset.instruction} Additional style note: ${profileStore.customLanguageNote}.`,
        }
      : preset
  },
)

async function loadNextBatch(isFirstLoad = false, sessionId = feedSessionId.value) {
  const topic = profileStore.activeTopic.trim()

  if (!profileStore.apiKey || !topic) {
    router.push('/onboarding')
    return
  }

  if (isFirstLoad) {
    isInitialLoading.value = true
  } else {
    isLoadingMore.value = true
  }

  error.value = ''

  try {
    const batch = await generateFeedBatch({
      apiKey: profileStore.apiKey,
      model: profileStore.feedModelId,
      topic,
      languagePreset: languagePreset.value,
      preferences: profileStore.preferences,
      recentTitles: feedStore.recentTitles,
    })

    if (sessionId !== feedSessionId.value || topic !== profileStore.activeTopic.trim()) {
      return
    }

    if (isFirstLoad) {
      feedStore.replaceFeed(batch)
    } else {
      feedStore.appendBatch(batch)
    }
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : 'Could not load the feed.'
  } finally {
    if (sessionId === feedSessionId.value) {
      isInitialLoading.value = false
      isLoadingMore.value = false
    }
  }
}

async function handleRegenerate() {
  const nextTopic = topicDraft.value.trim()

  if (!nextTopic) {
    error.value = 'Write a topic first.'
    return
  }

  feedSessionId.value += 1
  activeSaveItem.value = null
  error.value = ''
  profileStore.changeTopic(nextTopic)
  feedStore.clear()
  await loadNextBatch(true, feedSessionId.value)
}

function handleOpen(itemId: string) {
  router.push(`/article/${itemId}`)
}

function handleLike(itemId: string) {
  const item = feedStore.toggleLike(itemId)

  if (!item) {
    return
  }

  profileStore.recordLikeSignal(item, item.liked)
}

function handleSave(itemId: string) {
  activeSaveItem.value = feedStore.items.find((entry) => entry.id === itemId) ?? null
}

onMounted(async () => {
  if (!feedStore.items.length) {
    await loadNextBatch(true)
  }
})

watch(
  () => profileStore.activeTopic,
  (value) => {
    topicDraft.value = value
  },
)

watch(
  sentinel,
  (element, _, onCleanup) => {
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries

        if (entry?.isIntersecting && !isInitialLoading.value && !isLoadingMore.value) {
          await loadNextBatch(false)
        }
      },
      { rootMargin: '120px' },
    )

    observer.observe(element)
    onCleanup(() => observer.disconnect())
  },
  { immediate: true },
)
</script>

<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <p class="eyebrow">{{ profileStore.activeTopic }}</p>
      <h1>Your evolving AI study feed.</h1>
      <p class="lede">
        Likes tune the next batches. Open any card for a deeper generated breakdown and next-step reads.
      </p>
    </header>

    <details class="panel panel--compact feed-regenerate" open>
      <summary class="feed-regenerate__summary">
        <div class="section-heading">
          <h2>Regenerate the feed</h2>
          <p>Swap to a new topic without going back to onboarding.</p>
        </div>
        <span class="feed-regenerate__chevron" aria-hidden="true" />
      </summary>
      <div class="feed-regenerate__body">
        <label class="field">
          <span>New topic</span>
          <input
            v-model="topicDraft"
            class="input"
            type="text"
            placeholder="Linear algebra for ML, RLHF evaluation, sparse autoencoders..."
          />
        </label>
        <button class="button button--muted" type="button" :disabled="isInitialLoading || isLoadingMore" @click="handleRegenerate">
          Regenerate feed
        </button>
      </div>
    </details>

    <section class="stack">
      <LoadingBlock v-if="isInitialLoading" />
      <template v-else>
        <FeedCard
          v-for="item in feedStore.items"
          :key="item.id"
          :item="item"
          @open="handleOpen"
          @like="handleLike"
          @save="handleSave"
        />
        <p v-if="error" class="status status--error">{{ error }}</p>
        <LoadingBlock v-if="isLoadingMore" />
        <div ref="sentinel" class="feed-sentinel" />
      </template>
    </section>

    <SaveArticleSheet :open="Boolean(activeSaveItem)" :item="activeSaveItem" :detail="null" @close="activeSaveItem = null" />
  </section>
</template>

<style scoped>
.feed-regenerate {
  margin-bottom: 1rem;
}

.feed-regenerate__summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  list-style: none;
}

.feed-regenerate__summary::-webkit-details-marker {
  display: none;
}

.feed-regenerate__chevron {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  margin-top: 0.15rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: rgba(255, 255, 255, 0.75);
  position: relative;
}

.feed-regenerate__chevron::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 45%;
  width: 0.45rem;
  height: 0.45rem;
  border-right: 2px solid var(--color-ink);
  border-bottom: 2px solid var(--color-ink);
  transform: translate(-50%, -50%) rotate(45deg);
  transition: transform 0.2s ease;
}

.feed-regenerate[open] .feed-regenerate__chevron::after {
  top: 55%;
  transform: translate(-50%, -50%) rotate(225deg);
}

.feed-regenerate__body {
  display: grid;
  gap: 0.85rem;
  padding-top: 0.35rem;
}
</style>
