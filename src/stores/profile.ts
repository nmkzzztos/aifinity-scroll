import { defineStore } from 'pinia'

import { usePersistentState } from '@/composables/usePersistentState'
import { usePersonalization } from '@/composables/usePersonalization'
import type { FeedItem, UserProfile } from '@/types/models'
import { DEFAULT_ARTICLE_MODEL, DEFAULT_FEED_MODEL, STORAGE_KEYS } from '@/utils/constants'

const initialState: UserProfile = {
  apiKey: '',
  activeTopic: '',
  languagePresetId: 'en-research',
  customLanguageNote: '',
  feedModelId: DEFAULT_FEED_MODEL,
  articleModelId: DEFAULT_ARTICLE_MODEL,
  onboardingCompleted: false,
  suggestions: [],
  preferences: [],
  updatedAt: '',
}

export const useProfileStore = defineStore('profile', {
  state: () => {
    const { readStorage } = usePersistentState()
    const stored = readStorage(STORAGE_KEYS.profile, initialState)
    return {
      ...initialState,
      ...stored,
      feedModelId: stored.feedModelId || DEFAULT_FEED_MODEL,
      articleModelId: stored.articleModelId || DEFAULT_ARTICLE_MODEL,
    }
  },
  getters: {
    hasApiKey: (state) => Boolean(state.apiKey),
    isReady: (state) => Boolean(state.apiKey && state.activeTopic && state.onboardingCompleted),
    topPreferences: (state) => state.preferences.slice(0, 5),
  },
  actions: {
    persist() {
      const { writeStorage } = usePersistentState()
      this.updatedAt = new Date().toISOString()
      writeStorage(STORAGE_KEYS.profile, { ...this.$state })
    },
    setApiKey(value: string) {
      this.apiKey = value.trim()
      this.persist()
    },
    setSuggestions(suggestions: UserProfile['suggestions']) {
      this.suggestions = suggestions
      this.persist()
    },
    completeOnboarding(payload: {
      apiKey: string
      topic: string
      languagePresetId: string
      customLanguageNote: string
    }) {
      this.apiKey = payload.apiKey.trim()
      this.activeTopic = payload.topic.trim()
      this.languagePresetId = payload.languagePresetId
      this.customLanguageNote = payload.customLanguageNote.trim()
      this.onboardingCompleted = true
      this.persist()
    },
    changeTopic(topic: string) {
      this.activeTopic = topic.trim()
      this.preferences = []
      this.onboardingCompleted = true
      this.persist()
    },
    recordLikeSignal(item: FeedItem, liked: boolean) {
      const { applyLikeSignal } = usePersonalization()
      this.preferences = applyLikeSignal(this.preferences, item, liked)
      this.persist()
    },
    resetTopic() {
      this.activeTopic = ''
      this.suggestions = []
      this.preferences = []
      this.onboardingCompleted = false
      this.persist()
    },
    updateLanguagePreset(languagePresetId: string, customLanguageNote: string) {
      this.languagePresetId = languagePresetId
      this.customLanguageNote = customLanguageNote.trim()
      this.persist()
    },
    setOpenRouterModels(feedModelId: string, articleModelId: string) {
      this.feedModelId = feedModelId
      this.articleModelId = articleModelId
      this.persist()
    },
    clearAll() {
      Object.assign(this, initialState)
      this.persist()
    },
  },
})
