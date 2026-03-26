<script setup lang="ts">
import { computed, nextTick, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ArticleBlockCard from '@/components/article/ArticleBlockCard.vue'
import SaveArticleSheet from '@/components/feed/SaveArticleSheet.vue'
import LoadingBlock from '@/components/shared/LoadingBlock.vue'
import { useFeedGenerator } from '@/composables/useFeedGenerator'
import { putArticleDetail } from '@/services/db'
import { useFeedStore } from '@/stores/feed'
import { useProfileStore } from '@/stores/profile'
import type {
  ArticleBlockTransformationResponse,
  ArticleDetail,
  ArticleExpansionOption,
  ArticleSupplement,
  FeedItem,
  RelatedSuggestion,
} from '@/types/models'
import { LANGUAGE_PRESETS } from '@/utils/constants'
import { createId } from '@/utils/id'
import { renderMarkdown } from '@/utils/markdown'

interface ArticleRenderBlock {
  id: string
  label: string
  title: string
  markdown: string
  html: string
  source: 'overview' | 'base' | 'supplement'
  supplementId?: string
}

const route = useRoute()
const router = useRouter()
const feedStore = useFeedStore()
const profileStore = useProfileStore()
const {
  generateArticleBlockTransformation,
  generateArticleDetail,
  generateArticleSupplement,
  generateExpansionOptions,
  generateRelatedReads,
} = useFeedGenerator()

const detail = shallowRef<ArticleDetail | null>(null)
const isLoading = shallowRef(false)
const error = shallowRef('')
const showSave = shallowRef(false)
const isLoadingRelated = shallowRef(false)
const isLoadingExpansionOptions = shallowRef(false)
const activeExpansionOptionId = shallowRef('')
const selectedBlockId = shallowRef('')
const customInstruction = shallowRef('')
const activeBlockActionKey = shallowRef('')

const item = computed<FeedItem | null>(
  () => feedStore.items.find((entry) => entry.id === String(route.params.id)) ?? null,
)

const languagePreset = computed(() => {
  const preset =
    LANGUAGE_PRESETS.find((entry) => entry.id === profileStore.languagePresetId) ?? LANGUAGE_PRESETS[0]

  return profileStore.customLanguageNote
    ? {
        ...preset,
        instruction: `${preset.instruction} Additional style note: ${profileStore.customLanguageNote}.`,
      }
    : preset
})

function withNormalizedCollections(article: ArticleDetail): ArticleDetail {
  return {
    ...article,
    related: article.related ?? [],
    relatedLoaded: article.relatedLoaded ?? false,
    supplements: (article.supplements ?? []).map((supplement) => ({
      ...supplement,
      targetBlockId: supplement.targetBlockId ?? 'article-end',
    })),
    expansionOptions: article.expansionOptions ?? [],
    expansionOptionsLoaded: article.expansionOptionsLoaded ?? false,
  }
}

function buildOverviewMarkdown(article: ArticleDetail): string {
  return `## Overview\n\n${article.overview}`.trim()
}

function extractHeadingTitle(markdown: string): { title: string; label: string } {
  const firstLine = markdown.trim().split('\n')[0] ?? ''
  const match = firstLine.match(/^(#{1,6})\s+(.+)$/)

  if (!match) {
    return {
      title: 'Article section',
      label: 'Section',
    }
  }

  return {
    title: match[2].trim(),
    label: `H${match[1].length} Section`,
  }
}

function splitMarkdownBlocks(markdown: string): Array<{ id: string; markdown: string; title: string; label: string }> {
  const lines = markdown.split('\n')
  const chunks: string[] = []
  let buffer: string[] = []

  function flushBuffer() {
    const chunk = buffer.join('\n').trim()
    if (chunk) {
      chunks.push(chunk)
    }
    buffer = []
  }

  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line) && buffer.length) {
      flushBuffer()
    }

    buffer.push(line)
  }

  flushBuffer()

  return chunks.map((chunk, index) => {
    const heading = extractHeadingTitle(chunk)
    return {
      id: `base-${index}`,
      markdown: chunk,
      title: heading.title,
      label: heading.label,
    }
  })
}

function normalizeBlockTitle(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function buildSupplementMarkdown(supplement: ArticleSupplement): string {
  const body = supplement.markdown.trim()
  const firstLine = body.split('\n')[0] ?? ''
  const headingMatch = firstLine.match(/^#{1,6}\s+(.+)$/)
  if (
    headingMatch &&
    normalizeBlockTitle(headingMatch[1]) === normalizeBlockTitle(supplement.title)
  ) {
    return body
  }

  return `## ${supplement.title}\n\n${body}`.trim()
}

function stripLeadingHeading(markdown: string): string {
  return markdown.replace(/^#{1,6}\s+.+\n*/m, '').trim()
}

const articleBlocks = computed<ArticleRenderBlock[]>(() => {
  if (!detail.value) {
    return []
  }

  const article = withNormalizedCollections(detail.value)
  const blocks: ArticleRenderBlock[] = [
    {
      id: 'overview',
      label: 'Header Block',
      title: 'Overview',
      markdown: buildOverviewMarkdown(article),
      html: renderMarkdown(buildOverviewMarkdown(article)),
      source: 'overview',
    },
  ]

  const supplementsByTarget = new Map<string, ArticleSupplement[]>()
  const trailingSupplements: ArticleSupplement[] = []

  for (const supplement of article.supplements) {
    const target = supplement.targetBlockId || 'article-end'
    if (target === 'article-end') {
      trailingSupplements.push(supplement)
      continue
    }

    supplementsByTarget.set(target, [...(supplementsByTarget.get(target) ?? []), supplement])
  }

  const baseBlocks = splitMarkdownBlocks(article.markdown)

  function pushSupplements(targetId: string) {
    for (const supplement of supplementsByTarget.get(targetId) ?? []) {
      const markdown = buildSupplementMarkdown(supplement)
      blocks.push({
        id: supplement.id,
        label: supplement.kind === 'example' ? 'Added Example' : 'Added Extension',
        title: supplement.title,
        markdown,
        html: renderMarkdown(markdown),
        source: 'supplement',
        supplementId: supplement.id,
      })

      pushSupplements(supplement.id)
    }
  }

  pushSupplements('overview')

  for (const baseBlock of baseBlocks) {
    blocks.push({
      id: baseBlock.id,
      label: baseBlock.label,
      title: baseBlock.title,
      markdown: baseBlock.markdown,
      html: renderMarkdown(baseBlock.markdown),
      source: 'base',
    })

    pushSupplements(baseBlock.id)
  }

  for (const supplement of trailingSupplements) {
    const markdown = buildSupplementMarkdown(supplement)
    blocks.push({
      id: supplement.id,
      label: supplement.kind === 'example' ? 'Added Example' : 'Added Extension',
      title: supplement.title,
      markdown,
      html: renderMarkdown(markdown),
      source: 'supplement',
      supplementId: supplement.id,
    })
  }

  return blocks
})

const selectedBlock = computed(
  () => articleBlocks.value.find((block) => block.id === selectedBlockId.value) ?? null,
)

async function persistDetail(nextDetail: ArticleDetail) {
  const normalized = withNormalizedCollections(nextDetail)
  detail.value = normalized
  await putArticleDetail(normalized)
}

async function loadDetail() {
  if (!item.value) {
    error.value = 'This article is no longer available in the local feed.'
    return
  }

  if (!profileStore.apiKey) {
    router.push('/onboarding')
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    detail.value = withNormalizedCollections(
      await generateArticleDetail({
        apiKey: profileStore.apiKey,
        model: profileStore.articleModelId,
        item: item.value,
        languagePreset: languagePreset.value,
        preferences: profileStore.preferences,
      }),
    )
    feedStore.markDetailCached(item.value.id)
  } catch (unknownError) {
    error.value =
      unknownError instanceof Error ? unknownError.message : 'Could not load the detailed article.'
  } finally {
    isLoading.value = false
  }
}

function openRelated(related: RelatedSuggestion) {
  const nextItem = feedStore.createFromRelatedSuggestion(related, item.value?.topic ?? profileStore.activeTopic)
  router.push(`/article/${nextItem.id}`)
}

function handleSelectBlock(blockId: string) {
  selectedBlockId.value = selectedBlockId.value === blockId ? '' : blockId
  customInstruction.value = ''
}

function replaceBaseBlock(detailValue: ArticleDetail, targetBlockId: string, replacementMarkdown: string): ArticleDetail {
  const baseBlocks = splitMarkdownBlocks(detailValue.markdown)

  return {
    ...detailValue,
    markdown: baseBlocks
      .map((block) => (block.id === targetBlockId ? replacementMarkdown.trim() : block.markdown))
      .join('\n\n'),
  }
}

function replaceSupplementBlock(
  detailValue: ArticleDetail,
  supplementId: string,
  response: ArticleBlockTransformationResponse,
): ArticleDetail {
  return {
    ...detailValue,
    supplements: detailValue.supplements.map((supplement) =>
      supplement.id === supplementId
        ? {
            ...supplement,
            title: response.title || supplement.title,
            markdown: stripLeadingHeading(response.markdown) || response.markdown,
          }
        : supplement,
    ),
  }
}

function applyBlockTransformation(
  detailValue: ArticleDetail,
  block: ArticleRenderBlock,
  response: ArticleBlockTransformationResponse,
  mode: 'append' | 'replace',
  kind: 'example' | 'custom' | 'topic-expansion',
): ArticleDetail {
  const normalizedDetail = withNormalizedCollections(detailValue)
  const nextMarkdown = response.markdown.trim()

  if (mode === 'replace') {
    if (block.source === 'overview') {
      return {
        ...normalizedDetail,
        overview: stripLeadingHeading(nextMarkdown) || nextMarkdown,
      }
    }

    if (block.source === 'base') {
      return replaceBaseBlock(normalizedDetail, block.id, nextMarkdown)
    }

    if (block.supplementId) {
      return replaceSupplementBlock(normalizedDetail, block.supplementId, response)
    }
  }

  const supplement: ArticleSupplement = {
    id: createId('supplement'),
    kind,
    title: response.title || block.title,
    markdown: stripLeadingHeading(nextMarkdown) || nextMarkdown,
    createdAt: new Date().toISOString(),
    targetBlockId: block.id,
  }

  return {
    ...normalizedDetail,
    supplements: [...normalizedDetail.supplements, supplement],
  }
}

function upsertSupplement(detailValue: ArticleDetail, supplement: ArticleSupplement): ArticleDetail {
  const exists = detailValue.supplements.some((entry) => entry.id === supplement.id)

  return {
    ...detailValue,
    supplements: exists
      ? detailValue.supplements.map((entry) => (entry.id === supplement.id ? supplement : entry))
      : [...detailValue.supplements, supplement],
  }
}

function removeSupplement(detailValue: ArticleDetail, supplementId: string): ArticleDetail {
  return {
    ...detailValue,
    supplements: detailValue.supplements.filter((entry) => entry.id !== supplementId),
  }
}

async function handleBlockAction(action: 'example' | 'deepen' | 'custom', mode: 'append' | 'replace') {
  if (!item.value || !detail.value || !profileStore.apiKey || !selectedBlock.value) {
    return
  }

  if (action === 'custom' && !customInstruction.value.trim()) {
    error.value = 'Write what should be changed in this block first.'
    return
  }

  const block = selectedBlock.value
  const actionKey = `${block.id}:${action}:${mode}`
  activeBlockActionKey.value = actionKey
  error.value = ''
  const optimisticSupplementId = createId('supplement')
  const usesAppendFlow = mode === 'append'

  try {
    if (usesAppendFlow) {
      const optimisticDetail = upsertSupplement(detail.value, {
        id: optimisticSupplementId,
        kind: action === 'example' ? 'example' : 'custom',
        title: action === 'example' ? `Example for ${block.title}` : `Update for ${block.title}`,
        markdown: '_Generating additional content..._',
        createdAt: new Date().toISOString(),
        targetBlockId: block.id,
      })

      await persistDetail(optimisticDetail)
    }

    const response = await generateArticleBlockTransformation({
      apiKey: profileStore.apiKey,
      model: profileStore.articleModelId,
      item: item.value,
      detail: usesAppendFlow && detail.value
        ? removeSupplement(detail.value, optimisticSupplementId)
        : detail.value,
      languagePreset: languagePreset.value,
      blockTitle: block.title,
      blockMarkdown: block.markdown,
      action,
      mode,
      customInstruction: action === 'custom' ? customInstruction.value.trim() : undefined,
    })

    if (!response.markdown.trim()) {
      throw new Error('The model returned an empty block update.')
    }

    let nextDetail: ArticleDetail

    if (usesAppendFlow && detail.value) {
      const kind = action === 'example' ? 'example' : action === 'custom' ? 'custom' : 'topic-expansion'
      const nextSupplement: ArticleSupplement = {
        id: optimisticSupplementId,
        kind,
        title: response.title || block.title,
        markdown: stripLeadingHeading(response.markdown) || response.markdown,
        createdAt: new Date().toISOString(),
        targetBlockId: block.id,
      }

      nextDetail = upsertSupplement(removeSupplement(detail.value, optimisticSupplementId), nextSupplement)
    } else {
      nextDetail = applyBlockTransformation(
        detail.value,
        block,
        response,
        mode,
        action === 'example' ? 'example' : action === 'custom' ? 'custom' : 'topic-expansion',
      )
    }

    await persistDetail(nextDetail)
    selectedBlockId.value = ''
    customInstruction.value = ''
  } catch (unknownError) {
    if (usesAppendFlow && detail.value) {
      await persistDetail(removeSupplement(detail.value, optimisticSupplementId))
    }

    error.value =
      unknownError instanceof Error ? unknownError.message : 'Could not update the selected block.'
  } finally {
    activeBlockActionKey.value = ''
  }
}

const SIMPLER_PRESET =
  'Shorten and simplify this section while keeping the meaning intact.'

async function runCustomWithPreset(text: string, mode: 'append' | 'replace' = 'append') {
  customInstruction.value = text
  await nextTick()
  await handleBlockAction('custom', mode)
}

async function handleSimplerTune() {
  await runCustomWithPreset(SIMPLER_PRESET, 'replace')
}

async function handleGenerateRelated() {
  if (!item.value || !detail.value || !profileStore.apiKey) {
    return
  }

  isLoadingRelated.value = true
  error.value = ''

  try {
    detail.value = withNormalizedCollections(
      await generateRelatedReads({
        apiKey: profileStore.apiKey,
        model: profileStore.articleModelId,
        item: item.value,
        detail: detail.value,
        languagePreset: languagePreset.value,
        preferences: profileStore.preferences,
      }),
    )
  } catch (unknownError) {
    error.value =
      unknownError instanceof Error ? unknownError.message : 'Could not generate related reads.'
  } finally {
    isLoadingRelated.value = false
  }
}

async function handleLoadExpansionOptions() {
  if (!item.value || !detail.value || !profileStore.apiKey) {
    return
  }

  isLoadingExpansionOptions.value = true
  error.value = ''

  try {
    detail.value = withNormalizedCollections(
      await generateExpansionOptions({
        apiKey: profileStore.apiKey,
        model: profileStore.articleModelId,
        item: item.value,
        detail: detail.value,
        languagePreset: languagePreset.value,
      }),
    )
  } catch (unknownError) {
    error.value =
      unknownError instanceof Error ? unknownError.message : 'Could not suggest article extensions.'
  } finally {
    isLoadingExpansionOptions.value = false
  }
}

async function handleAppendTopic(option: ArticleExpansionOption) {
  if (!item.value || !detail.value || !profileStore.apiKey) {
    return
  }

  activeExpansionOptionId.value = option.id
  error.value = ''

  try {
    const appended = withNormalizedCollections(
      await generateArticleSupplement({
        apiKey: profileStore.apiKey,
        model: profileStore.articleModelId,
        item: item.value,
        detail: detail.value,
        languagePreset: languagePreset.value,
        kind: 'topic-expansion',
        selectedOption: option,
      }),
    )

    const filteredDetail = {
      ...appended,
      expansionOptions: appended.expansionOptions.filter((entry) => entry.id !== option.id),
    }

    await persistDetail(filteredDetail)
  } catch (unknownError) {
    error.value =
      unknownError instanceof Error ? unknownError.message : 'Could not append the selected topic.'
  } finally {
    activeExpansionOptionId.value = ''
  }
}

watch(
  () => route.params.id,
  async () => {
    detail.value = null
    isLoadingRelated.value = false
    isLoadingExpansionOptions.value = false
    activeExpansionOptionId.value = ''
    selectedBlockId.value = ''
    customInstruction.value = ''
    activeBlockActionKey.value = ''
    await loadDetail()
  },
  { immediate: true },
)
</script>

<template>
  <section class="page">
    <div class="page__topbar">
      <button class="ghost-button" type="button" @click="router.back()">Back</button>
      <button class="ghost-button" type="button" @click="showSave = true">Save</button>
    </div>

    <LoadingBlock v-if="isLoading" />

    <template v-else-if="item && detail">
      <header class="page__hero page__hero--compact">
        <p class="eyebrow">{{ item.topic }}</p>
        <h1>{{ detail.title }}</h1>
      </header>

      <section class="stack">
        <div class="article-body">
          <ArticleBlockCard
            v-for="block in articleBlocks"
            :key="block.id"
            :block-id="block.id"
            :label="block.label"
            :html="block.html"
            :selected="selectedBlockId === block.id"
            :interactive="true"
            embedded
            @select="handleSelectBlock"
          >
          <template #tune>
            <div class="block-menu block-menu--minimal">
              <div class="block-menu__send-row">
                <label class="visually-hidden" :for="`tune-instruction-${block.id}`">What to change</label>
                <input
                  :id="`tune-instruction-${block.id}`"
                  v-model="customInstruction"
                  class="input input--tune-inline"
                  type="text"
                  autocomplete="off"
                  placeholder="What to change"
                  enterkeyhint="send"
                  @keydown.enter.prevent="handleBlockAction('custom', 'append')"
                />
              </div>

              <div class="block-menu__split">
                <button
                  class="button button--tune-send"
                  type="button"
                  :disabled="Boolean(activeBlockActionKey)"
                  @click="handleBlockAction('custom', 'append')"
                >
                  {{ activeBlockActionKey === `${block.id}:custom:append` ? '…' : 'Send' }}
                </button>
                <button
                  class="button button--muted button--tune-send"
                  type="button"
                  :disabled="Boolean(activeBlockActionKey)"
                  @click="handleBlockAction('custom', 'replace')"
                >
                  {{ activeBlockActionKey === `${block.id}:custom:replace` ? '…' : 'Replace' }}
                </button>
              </div>

              <button
                class="button button--muted button--tune-line"
                type="button"
                :disabled="Boolean(activeBlockActionKey)"
                @click="handleSimplerTune"
              >
                {{ activeBlockActionKey === `${block.id}:custom:replace` ? '…' : 'Simpler' }}
              </button>

              <button
                class="button button--muted button--tune-line"
                type="button"
                :disabled="Boolean(activeBlockActionKey)"
                @click="handleBlockAction('example', 'append')"
              >
                {{ activeBlockActionKey === `${block.id}:example:append` ? '…' : 'Example' }}
              </button>

              <button
                class="button button--muted button--tune-line"
                type="button"
                :disabled="Boolean(activeBlockActionKey)"
                @click="handleBlockAction('deepen', 'replace')"
              >
                {{ activeBlockActionKey === `${block.id}:deepen:replace` ? '…' : 'Deeper' }}
              </button>
            </div>
          </template>
          </ArticleBlockCard>
        </div>

        <section class="panel">
          <div class="section-heading">
            <h2>Suggested extra angles</h2>
            <p>Generate optional extensions for the article, then add only the one you want.</p>
          </div>

          <button
            class="button button--muted"
            type="button"
            :disabled="isLoadingExpansionOptions"
            @click="handleLoadExpansionOptions"
          >
            {{ isLoadingExpansionOptions ? 'Thinking...' : 'Suggest extra angles' }}
          </button>

          <TransitionGroup v-if="detail.expansionOptions.length" name="angle-stack" tag="div" class="expansion-options">
            <button
              v-for="option in detail.expansionOptions"
              :key="option.id"
              type="button"
              class="related-card"
              :disabled="activeExpansionOptionId === option.id"
              @click="handleAppendTopic(option)"
            >
              <span class="related-card__title">{{ option.label }}</span>
              <span class="related-card__reason">{{ option.reason }}</span>
              <span class="related-card__angle">
                {{ activeExpansionOptionId === option.id ? 'Adding to article...' : 'Add to article' }}
              </span>
            </button>
          </TransitionGroup>
        </section>

        <section class="panel">
          <div class="section-heading">
            <h2>Related next reads</h2>
            <p>Generate them only when you actually want a next branch.</p>
          </div>
          <button
            v-if="!detail.relatedLoaded"
            class="button button--muted"
            type="button"
            :disabled="isLoadingRelated"
            @click="handleGenerateRelated"
          >
            {{ isLoadingRelated ? 'Generating related reads...' : 'Generate related next reads' }}
          </button>
          <template v-else>
            <button
              v-for="related in detail.related"
              :key="related.id"
              type="button"
              class="related-card"
              @click="openRelated(related)"
            >
              <span class="related-card__title">{{ related.title }}</span>
              <span class="related-card__angle">{{ related.angle }}</span>
              <span class="related-card__reason">{{ related.reason }}</span>
            </button>
          </template>
        </section>

        <p v-if="error" class="status status--error">{{ error }}</p>
      </section>
    </template>

    <p v-else-if="error" class="status status--error">{{ error }}</p>

    <SaveArticleSheet :open="showSave" :item="item" :detail="detail" @close="showSave = false" />
  </section>
</template>
