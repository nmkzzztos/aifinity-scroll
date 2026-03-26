<script setup lang="ts">
import { computed, reactive, shallowRef } from 'vue'
import { useRouter } from 'vue-router'

import TopicSuggestionGrid from '@/components/onboarding/TopicSuggestionGrid.vue'
import LoadingBlock from '@/components/shared/LoadingBlock.vue'
import { useFeedGenerator } from '@/composables/useFeedGenerator'
import { useProfileStore } from '@/stores/profile'
import type { TopicSuggestion } from '@/types/models'
import { LANGUAGE_PRESETS } from '@/utils/constants'

const router = useRouter()
const profileStore = useProfileStore()
const { generateTopicSuggestions } = useFeedGenerator()

const form = reactive({
  apiKey: profileStore.apiKey,
  topicSeed: profileStore.activeTopic,
  selectedTopic: profileStore.activeTopic,
  languagePresetId: profileStore.languagePresetId,
  customLanguageNote: profileStore.customLanguageNote,
})

const isLoading = shallowRef(false)
const error = shallowRef('')

const selectedPreset = computed(
  () => {
    const preset = LANGUAGE_PRESETS.find((entry) => entry.id === form.languagePresetId) ?? LANGUAGE_PRESETS[0]

    return form.customLanguageNote
      ? {
          ...preset,
          instruction: `${preset.instruction} Additional style note: ${form.customLanguageNote}.`,
        }
      : preset
  },
)

const canContinue = computed(() => Boolean(form.apiKey.trim() && form.selectedTopic.trim()))

function applySuggestion(suggestion: TopicSuggestion) {
  form.selectedTopic = suggestion.title
  form.topicSeed = suggestion.title
}

async function handleGenerate() {
  if (!form.apiKey.trim()) {
    error.value = 'Paste your OpenRouter API key first.'
    return
  }

  isLoading.value = true
  error.value = ''
  profileStore.setApiKey(form.apiKey)

  try {
    const suggestions = await generateTopicSuggestions({
      apiKey: form.apiKey.trim(),
      model: profileStore.feedModelId,
      seed: form.topicSeed.trim(),
      languagePreset: selectedPreset.value,
    })

    profileStore.setSuggestions(suggestions)

    if (!form.selectedTopic && suggestions[0]) {
      form.selectedTopic = suggestions[0].title
    }
  } catch (unknownError) {
    error.value =
      unknownError instanceof Error ? unknownError.message : 'Could not generate topic directions.'
  } finally {
    isLoading.value = false
  }
}

function handleContinue() {
  if (!canContinue.value) {
    error.value = 'Choose or type a topic first.'
    return
  }

  profileStore.completeOnboarding({
    apiKey: form.apiKey,
    topic: form.selectedTopic,
    languagePresetId: form.languagePresetId,
    customLanguageNote: form.customLanguageNote,
  })

  router.push('/feed')
}
</script>

<template>
  <section class="page page--onboarding">
    <header class="page__hero">
      <p class="eyebrow">Infinity Scroll</p>
      <h1>Build a feed that studies exactly what you want next.</h1>
      <p class="lede">
        Start with a topic, let the model propose research directions, then keep shaping the feed by
        liking what feels worth your time.
      </p>
    </header>

    <section class="panel">
      <label class="field">
        <span>OpenRouter API key</span>
        <input v-model="form.apiKey" class="input" type="password" placeholder="sk-or-v1-..." />
      </label>

      <label class="field">
        <span>What do you want to explore?</span>
        <textarea
          v-model="form.topicSeed"
          class="textarea"
          rows="3"
          placeholder="Post-training LLM methods, sparse experts, evaluation..."
        />
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
        <span>Optional style note</span>
        <input
          v-model="form.customLanguageNote"
          class="input"
          type="text"
          placeholder="More concise, more academic, more beginner-friendly..."
        />
      </label>

      <div class="actions">
        <button class="button button--muted" type="button" :disabled="isLoading" @click="handleGenerate">
          {{ isLoading ? 'Generating...' : 'Suggest directions' }}
        </button>
        <button class="button" type="button" :disabled="!canContinue" @click="handleContinue">
          Enter feed
        </button>
      </div>

      <p v-if="error" class="status status--error">{{ error }}</p>
    </section>

    <section class="panel">
      <div class="section-heading">
        <h2>Suggested directions</h2>
        <p>Pick one or keep your own custom topic in the field above.</p>
      </div>

      <LoadingBlock v-if="isLoading" />
      <TopicSuggestionGrid
        v-else-if="profileStore.suggestions.length"
        :suggestions="profileStore.suggestions"
        :selected-title="form.selectedTopic"
        @select="applySuggestion"
      />
      <p v-else class="status">Your first AI-generated study directions will appear here.</p>
    </section>
  </section>
</template>
