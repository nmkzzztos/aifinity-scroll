import { defineStore } from 'pinia'

import { usePersistentState } from '@/composables/usePersistentState'
import type { FeedItem, RelatedSuggestion } from '@/types/models'
import { STORAGE_KEYS } from '@/utils/constants'
import { createId } from '@/utils/id'

interface FeedState {
  items: FeedItem[]
  batchesLoaded: number
  lastLoadedAt: string
}

const initialState: FeedState = {
  items: [],
  batchesLoaded: 0,
  lastLoadedAt: '',
}

export const useFeedStore = defineStore('feed', {
  state: () => {
    const { readStorage } = usePersistentState()
    return readStorage(STORAGE_KEYS.feed, initialState)
  },
  getters: {
    recentTitles: (state) => state.items.slice(-14).map((item) => item.title),
  },
  actions: {
    persist() {
      const { writeStorage } = usePersistentState()
      writeStorage(STORAGE_KEYS.feed, { ...this.$state })
    },
    replaceFeed(items: FeedItem[]) {
      this.items = [...items]
      this.batchesLoaded = items.length ? 1 : 0
      this.lastLoadedAt = items.length ? new Date().toISOString() : ''
      this.persist()
    },
    appendBatch(items: FeedItem[]) {
      this.items = [...this.items, ...items]
      this.batchesLoaded += 1
      this.lastLoadedAt = new Date().toISOString()
      this.persist()
    },
    toggleLike(itemId: string): FeedItem | null {
      const item = this.items.find((entry) => entry.id === itemId)

      if (!item) {
        return null
      }

      item.liked = !item.liked
      this.persist()
      return { ...item }
    },
    markDetailCached(itemId: string) {
      const item = this.items.find((entry) => entry.id === itemId)

      if (!item) {
        return
      }

      item.detailCached = true
      this.persist()
    },
    upsertItem(item: FeedItem) {
      const index = this.items.findIndex((entry) => entry.id === item.id)

      if (index === -1) {
        this.items = [item, ...this.items]
      } else {
        this.items.splice(index, 1, item)
      }

      this.persist()
    },
    createFromRelatedSuggestion(suggestion: RelatedSuggestion, topic: string): FeedItem {
      const item: FeedItem = {
        id: createId('feed'),
        batchId: createId('related-batch'),
        title: suggestion.title,
        tldr: suggestion.reason,
        howItWorks: suggestion.subtopics.map((entry) => `Angle: ${entry}`),
        whyItMatters: suggestion.reason,
        summary: suggestion.reason,
        topic,
        subtopics: suggestion.subtopics,
        estimatedReadMinutes: 4,
        tone: suggestion.angle,
        createdAt: new Date().toISOString(),
        liked: false,
        detailCached: false,
      }

      this.items = [item, ...this.items]
      this.persist()
      return item
    },
    clear() {
      Object.assign(this, initialState)
      this.persist()
    },
  },
})
