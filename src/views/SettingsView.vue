<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

import { clearDatabase } from '@/services/db'
import { exportAppData } from '@/services/export'
import { useFeedStore } from '@/stores/feed'
import { useLibraryStore } from '@/stores/library'
import ModelSelectDropdown from '@/components/settings/ModelSelectDropdown.vue'
import { useProfileStore } from '@/stores/profile'
import { LANGUAGE_PRESETS, OPENROUTER_MODEL_PRESETS } from '@/utils/constants'

const router = useRouter()
const profileStore = useProfileStore()
const feedStore = useFeedStore()
const libraryStore = useLibraryStore()

const form = reactive({
  apiKey: profileStore.apiKey,
  languagePresetId: profileStore.languagePresetId,
  customLanguageNote: profileStore.customLanguageNote,
  feedModelId: profileStore.feedModelId,
  articleModelId: profileStore.articleModelId,
})

function saveSettings() {
  profileStore.setApiKey(form.apiKey)
  profileStore.updateLanguagePreset(form.languagePresetId, form.customLanguageNote)
  profileStore.setOpenRouterModels(form.feedModelId, form.articleModelId)
}

async function clearAllData() {
  const confirmed = window.confirm('Clear all local data, feed items, saved library, and cached article bodies?')

  if (!confirmed) {
    return
  }

  profileStore.clearAll()
  feedStore.clear()
  libraryStore.clear()
  await clearDatabase()
  router.push('/onboarding')
}

function resetTopic() {
  profileStore.resetTopic()
  feedStore.clear()
  router.push('/onboarding')
}
</script>

<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <p class="eyebrow">Settings</p>
      <h1>Local controls for key, tone, and stored knowledge.</h1>
    </header>

    <section class="panel">
      <label class="field">
        <span>OpenRouter API key</span>
        <input v-model="form.apiKey" class="input" type="password" placeholder="sk-or-v1-..." />
      </label>

      <div class="section-heading section-heading--tight">
        <h2>Models</h2>
        <p>Feed uses one model; full articles, block tools, related reads, and library suggestions use another.</p>
      </div>

      <label class="field">
        <span>Feed &amp; topic discovery</span>
        <ModelSelectDropdown v-model="form.feedModelId" :presets="OPENROUTER_MODEL_PRESETS" />
      </label>

      <label class="field">
        <span>Articles &amp; library AI</span>
        <ModelSelectDropdown v-model="form.articleModelId" :presets="OPENROUTER_MODEL_PRESETS" />
      </label>

      <div class="preset-list">
        <button
          v-for="preset in LANGUAGE_PRESETS"
          :key="preset.id"
          type="button"
          class="preset"
          :class="{ 'preset--active': form.languagePresetId === preset.id }"
          @click="form.languagePresetId = preset.id"
        >
          <span class="preset__title">{{ preset.label }}</span>
          <span class="preset__description">{{ preset.description }}</span>
        </button>
      </div>

      <label class="field">
        <span>Custom style note</span>
        <input
          v-model="form.customLanguageNote"
          class="input"
          type="text"
          placeholder="More visual, more theoretical, more concise..."
        />
      </label>

      <button class="button" type="button" @click="saveSettings">Save settings</button>
    </section>

    <section class="panel">
      <div class="section-heading">
        <h2>Data</h2>
        <p>Everything here is local-only in this browser.</p>
      </div>

      <div class="stack">
        <button class="button button--muted" type="button" @click="exportAppData">Export local snapshot</button>
        <button class="button button--muted" type="button" @click="resetTopic">Reset topic and regenerate feed</button>
        <button class="button button--danger" type="button" @click="clearAllData">Clear all local data</button>
      </div>
    </section>
  </section>
</template>
