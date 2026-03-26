<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'

import BaseSheet from '@/components/shared/BaseSheet.vue'
import { useLibrary } from '@/composables/useLibrary'
import { useLibraryStore } from '@/stores/library'
import { useProfileStore } from '@/stores/profile'
import type { ArticleDetail, FeedItem, SaveRecommendation } from '@/types/models'
import { LANGUAGE_PRESETS } from '@/utils/constants'

const props = defineProps<{
  open: boolean
  item: FeedItem | null
  detail: ArticleDetail | null
}>()

const emit = defineEmits<{
  close: []
}>()

const profileStore = useProfileStore()
const libraryStore = useLibraryStore()
const { recommendSave, saveArticle } = useLibrary()

const mode = shallowRef<'manual' | 'ai'>('manual')
const form = reactive({
  title: '',
  description: '',
  folderChoice: '',
  newFolderName: '',
  newFolderDescription: '',
  categoriesText: '',
})

const recommendation = shallowRef<SaveRecommendation | null>(null)
const isSaving = shallowRef(false)
const isRecommending = shallowRef(false)
const error = shallowRef('')
const success = shallowRef('')

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

const existingFolders = computed(() => libraryStore.folders)

function resetForm() {
  form.title = props.item?.title ?? ''
  form.description = props.item?.summary ?? ''
  form.folderChoice = existingFolders.value[0]?.id ?? ''
  form.newFolderName = props.item?.topic ?? ''
  form.newFolderDescription = props.item ? `Saved ideas around ${props.item.topic}.` : ''
  form.categoriesText = props.item?.subtopics.join(', ') ?? ''
  recommendation.value = null
  error.value = ''
  success.value = ''
}

watch(
  () => [props.open, props.item?.id],
  () => {
    if (props.open) {
      resetForm()
    }
  },
  { immediate: true },
)

async function handleRecommend() {
  if (!props.item) {
    return
  }

  if (!profileStore.apiKey) {
    error.value = 'Add your OpenRouter key before requesting AI save suggestions.'
    return
  }

  isRecommending.value = true
  error.value = ''

  try {
    const next = await recommendSave({
      apiKey: profileStore.apiKey,
      model: profileStore.articleModelId,
      item: props.item,
      detail: props.detail,
      languagePreset: languagePreset.value,
    })

    recommendation.value = next
    form.newFolderName = next.folderName
    form.newFolderDescription = next.folderDescription
    form.categoriesText = next.categories.join(', ')

    const matchedFolder = existingFolders.value.find(
      (folder) => folder.name.toLowerCase() === next.folderName.toLowerCase(),
    )
    form.folderChoice = matchedFolder?.id ?? ''
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : 'Could not classify article.'
  } finally {
    isRecommending.value = false
  }
}

async function handleSave() {
  if (!props.item) {
    return
  }

  isSaving.value = true
  error.value = ''
  success.value = ''

  try {
    const categories = form.categoriesText
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)

    const shouldUseExistingFolder =
      (mode.value === 'manual' && Boolean(form.folderChoice)) ||
      (mode.value === 'ai' && recommendation.value?.mode === 'existing' && Boolean(form.folderChoice))

    await saveArticle({
      item: props.item,
      detail: props.detail,
      title: form.title,
      description: form.description,
      folderId: shouldUseExistingFolder ? form.folderChoice : undefined,
      newFolderName: shouldUseExistingFolder ? undefined : form.newFolderName,
      newFolderDescription: shouldUseExistingFolder ? undefined : form.newFolderDescription,
      categories,
    })

    success.value = 'Saved to your library.'
  } catch (unknownError) {
    error.value = unknownError instanceof Error ? unknownError.message : 'Could not save article.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseSheet :open="open" title="Save article" @close="emit('close')">
    <div class="save-sheet__mode">
      <button
        type="button"
        class="save-sheet__toggle"
        :class="{ 'save-sheet__toggle--active': mode === 'manual' }"
        @click="mode = 'manual'"
      >
        Manual
      </button>
      <button
        type="button"
        class="save-sheet__toggle"
        :class="{ 'save-sheet__toggle--active': mode === 'ai' }"
        @click="mode = 'ai'"
      >
        AI Assist
      </button>
    </div>

    <label class="save-sheet__field">
      <span>Title</span>
      <input v-model="form.title" class="save-sheet__input" type="text" />
    </label>

    <label class="save-sheet__field">
      <span>Description</span>
      <textarea v-model="form.description" class="save-sheet__textarea" rows="3" />
    </label>

    <template v-if="mode === 'manual'">
      <label class="save-sheet__field">
        <span>Existing folder</span>
        <select v-model="form.folderChoice" class="save-sheet__input">
          <option value="">Create new folder</option>
          <option v-for="folder in existingFolders" :key="folder.id" :value="folder.id">
            {{ folder.name }}
          </option>
        </select>
      </label>
    </template>

    <template v-if="mode === 'ai'">
      <button class="save-sheet__action" type="button" :disabled="isRecommending" @click="handleRecommend">
        {{ isRecommending ? 'Thinking...' : 'Suggest folder and categories' }}
      </button>
      <p v-if="recommendation" class="save-sheet__note">{{ recommendation.rationale }}</p>
    </template>

    <label class="save-sheet__field">
      <span>New or suggested folder name</span>
      <input v-model="form.newFolderName" class="save-sheet__input" type="text" />
    </label>

    <label class="save-sheet__field">
      <span>Folder description</span>
      <textarea v-model="form.newFolderDescription" class="save-sheet__textarea" rows="2" />
    </label>

    <label class="save-sheet__field">
      <span>Categories</span>
      <input
        v-model="form.categoriesText"
        class="save-sheet__input"
        type="text"
        placeholder="LLM, optimization, tooling"
      />
    </label>

    <p v-if="error" class="save-sheet__status save-sheet__status--error">{{ error }}</p>
    <p v-if="success" class="save-sheet__status save-sheet__status--success">{{ success }}</p>

    <button class="save-sheet__submit" type="button" :disabled="isSaving" @click="handleSave">
      {{ isSaving ? 'Saving...' : 'Save to library' }}
    </button>
  </BaseSheet>
</template>

<style scoped>
.save-sheet__mode {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.55rem;
}

.save-sheet__toggle,
.save-sheet__action,
.save-sheet__submit {
  min-height: 2.9rem;
  border: 0;
  border-radius: 999px;
  background: #e9ece4;
  color: var(--color-ink);
  font: inherit;
}

.save-sheet__toggle--active,
.save-sheet__submit {
  background: #1f3128;
  color: #f8f4ec;
}

.save-sheet__field {
  display: grid;
  gap: 0.45rem;
}

.save-sheet__field span {
  font-size: 0.88rem;
  color: var(--color-ink-muted);
}

.save-sheet__input,
.save-sheet__textarea {
  width: 100%;
  border: 1px solid rgba(70, 82, 76, 0.16);
  border-radius: 1rem;
  background: #fff;
  padding: 0.85rem 0.95rem;
  font: inherit;
  color: var(--color-ink);
}

.save-sheet__textarea {
  resize: vertical;
}

.save-sheet__note,
.save-sheet__status {
  margin: 0;
  font-size: 0.9rem;
}

.save-sheet__status--error {
  color: #8b3722;
}

.save-sheet__status--success {
  color: #285b3e;
}
</style>
