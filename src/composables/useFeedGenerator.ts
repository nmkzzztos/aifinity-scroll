import { useOpenRouter } from '@/composables/useOpenRouter'
import { usePersonalization } from '@/composables/usePersonalization'
import { getArticleDetail, putArticleDetail, putFeedBody } from '@/services/db'
import {
  buildArticleBlockTransformationPrompt,
  buildArticleDetailPrompt,
  buildArticleExpansionOptionsPrompt,
  buildArticleSupplementPrompt,
  buildFeedBatchPrompt,
  buildRelatedReadsPrompt,
  buildTopicSuggestionsPrompt,
} from '@/services/prompts'
import type {
  ArticleDetail,
  ArticleDetailResponse,
  ArticleBlockTransformationResponse,
  ArticleExpansionOption,
  ArticleExpansionOptionsResponse,
  ArticleSupplement,
  ArticleSupplementResponse,
  FeedBatchResponse,
  FeedItem,
  LanguagePreset,
  RelatedSuggestion,
  RelatedSuggestionResponse,
  TopicPreference,
  TopicSuggestion,
  TopicSuggestionResponse,
} from '@/types/models'
import { DEFAULT_FEED_BATCH_SIZE } from '@/utils/constants'
import { createId } from '@/utils/id'

export function useFeedGenerator() {
  const { requestJson } = useOpenRouter()
  const { preferenceDigest } = usePersonalization()

  function normalizeArticleDetail(detail: ArticleDetail): ArticleDetail {
    return {
      ...detail,
      markdown: detail.markdown ?? '',
      sections: detail.sections ?? [],
      takeaways: detail.takeaways ?? [],
      related: detail.related ?? [],
      relatedLoaded: detail.relatedLoaded ?? false,
      supplements: (detail.supplements ?? []).map((supplement) => ({
        ...supplement,
        targetBlockId: supplement.targetBlockId ?? 'article-end',
      })),
      expansionOptions: detail.expansionOptions ?? [],
      expansionOptionsLoaded: detail.expansionOptionsLoaded ?? false,
    }
  }

  async function generateTopicSuggestions(options: {
    apiKey: string
    model: string
    seed: string
    languagePreset: LanguagePreset
  }): Promise<TopicSuggestion[]> {
    const response = await requestJson<TopicSuggestionResponse>({
      apiKey: options.apiKey,
      model: options.model,
      systemPrompt: 'You generate discovery-oriented study directions as JSON.',
      userPrompt: buildTopicSuggestionsPrompt(options.seed, options.languagePreset),
      temperature: 0.95,
    })

    return response.suggestions.slice(0, 8).map((suggestion) => ({
      id: createId('topic'),
      title: suggestion.title,
      subtitle: suggestion.subtitle,
      whyNow: suggestion.whyNow,
      subtopics: suggestion.subtopics ?? [],
    }))
  }

  async function generateFeedBatch(options: {
    apiKey: string
    model: string
    topic: string
    languagePreset: LanguagePreset
    preferences: TopicPreference[]
    recentTitles: string[]
    cardCount?: number
  }): Promise<FeedItem[]> {
    const batchId = createId('batch')
    const generatedAt = new Date().toISOString()
    const cardCount = Math.min(10, Math.max(1, options.cardCount ?? DEFAULT_FEED_BATCH_SIZE))

    const response = await requestJson<FeedBatchResponse>({
      apiKey: options.apiKey,
      model: options.model,
      systemPrompt: 'You generate short educational feed cards as JSON.',
      userPrompt: buildFeedBatchPrompt({
        topic: options.topic,
        languagePreset: options.languagePreset,
        preferences: preferenceDigest(options.preferences),
        recentTitles: options.recentTitles,
        cardCount,
      }),
      temperature: 0.98,
    })

    const seenTitles = new Set<string>()
    const prepared = response.items
      .filter((item) => {
        const normalized = item.title.trim().toLowerCase()

        if (!normalized || seenTitles.has(normalized)) {
          return false
        }

        seenTitles.add(normalized)
        return true
      })
      .slice(0, cardCount)
      .map((raw) => {
        const summary = raw.summary || raw.whyItMatters || raw.tldr
        const feedItem: FeedItem = {
          id: createId('feed'),
          batchId,
          title: raw.title,
          tldr: raw.tldr || raw.summary,
          howItWorks: raw.howItWorks ?? [],
          whyItMatters: raw.whyItMatters || raw.summary,
          summary,
          topic: options.topic,
          subtopics: raw.subtopics ?? [],
          estimatedReadMinutes: Math.max(1, Math.min(12, raw.estimatedReadMinutes ?? 3)),
          tone: raw.tone || 'Fresh',
          createdAt: generatedAt,
          liked: false,
          detailCached: false,
        }

        return {
          feedItem,
          body: raw.body ?? summary,
        }
      })

    await Promise.all(
      prepared.map(({ feedItem, body }) =>
        putFeedBody({
          id: feedItem.id,
          body,
          generatedAt,
        }),
      ),
    )

    return prepared.map(({ feedItem }) => feedItem)
  }

  async function generateArticleDetail(options: {
    apiKey: string
    model: string
    item: FeedItem
    languagePreset: LanguagePreset
    preferences: TopicPreference[]
  }): Promise<ArticleDetail> {
    const cached = await getArticleDetail(options.item.id)

    if (cached) {
      return normalizeArticleDetail(cached)
    }

    const response = await requestJson<ArticleDetailResponse>({
      apiKey: options.apiKey,
      model: options.model,
      systemPrompt: 'You expand compact feed cards into structured learning articles as JSON.',
      userPrompt: buildArticleDetailPrompt({
        item: options.item,
        languagePreset: options.languagePreset,
        preferences: preferenceDigest(options.preferences),
      }),
      temperature: 0.85,
    })

    const detail: ArticleDetail = {
      id: options.item.id,
      feedItemId: options.item.id,
      title: options.item.title,
      overview: response.overview,
      markdown: response.markdown ?? '',
      sections: response.sections ?? [],
      takeaways: response.takeaways ?? [],
      related: [],
      relatedLoaded: false,
      supplements: [],
      expansionOptions: [],
      expansionOptionsLoaded: false,
      generatedAt: new Date().toISOString(),
    }

    await putArticleDetail(detail)

    return normalizeArticleDetail(detail)
  }

  async function generateRelatedReads(options: {
    apiKey: string
    model: string
    item: FeedItem
    detail: ArticleDetail
    languagePreset: LanguagePreset
    preferences: TopicPreference[]
  }): Promise<ArticleDetail> {
    if (options.detail.relatedLoaded) {
      return normalizeArticleDetail(options.detail)
    }

    const response = await requestJson<RelatedSuggestionResponse>({
      apiKey: options.apiKey,
      model: options.model,
      systemPrompt: 'You generate related reading suggestions as JSON.',
      userPrompt: buildRelatedReadsPrompt({
        item: options.item,
        detail: options.detail,
        languagePreset: options.languagePreset,
        preferences: preferenceDigest(options.preferences),
      }),
      temperature: 0.8,
    })

    const nextDetail = normalizeArticleDetail({
      ...options.detail,
      related: (response.related ?? []).slice(0, 3).map<RelatedSuggestion>((entry) => ({
        id: createId('related'),
        title: entry.title,
        angle: entry.angle,
        reason: entry.reason,
        subtopics: entry.subtopics ?? [],
      })),
      relatedLoaded: true,
    })

    await putArticleDetail(nextDetail)
    return nextDetail
  }

  async function generateExpansionOptions(options: {
    apiKey: string
    model: string
    item: FeedItem
    detail: ArticleDetail
    languagePreset: LanguagePreset
  }): Promise<ArticleDetail> {
    if (options.detail.expansionOptionsLoaded) {
      return normalizeArticleDetail(options.detail)
    }

    const response = await requestJson<ArticleExpansionOptionsResponse>({
      apiKey: options.apiKey,
      model: options.model,
      systemPrompt: 'You propose article expansion directions as JSON.',
      userPrompt: buildArticleExpansionOptionsPrompt({
        item: options.item,
        detail: options.detail,
        languagePreset: options.languagePreset,
      }),
      temperature: 0.7,
    })

    const nextDetail = normalizeArticleDetail({
      ...options.detail,
      expansionOptions: (response.options ?? []).slice(0, 4).map<ArticleExpansionOption>((entry) => ({
        id: createId('expand-option'),
        label: entry.label,
        reason: entry.reason,
      })),
      expansionOptionsLoaded: true,
    })

    await putArticleDetail(nextDetail)
    return nextDetail
  }

  async function generateArticleSupplement(options: {
    apiKey: string
    model: string
    item: FeedItem
    detail: ArticleDetail
    languagePreset: LanguagePreset
    kind: 'example' | 'topic-expansion'
    selectedOption?: ArticleExpansionOption
  }): Promise<ArticleDetail> {
    const response = await requestJson<ArticleSupplementResponse>({
      apiKey: options.apiKey,
      model: options.model,
      systemPrompt: 'You extend an existing article with one focused add-on section as JSON.',
      userPrompt: buildArticleSupplementPrompt({
        item: options.item,
        detail: options.detail,
        languagePreset: options.languagePreset,
        kind: options.kind,
        selectedOption: options.selectedOption,
      }),
      temperature: 0.8,
    })

    const supplement: ArticleSupplement = {
      id: createId('supplement'),
      kind: options.kind,
      title: response.title,
      markdown: response.markdown,
      createdAt: new Date().toISOString(),
      sourceTopic: options.selectedOption?.label,
      targetBlockId: 'article-end',
    }

    const nextDetail = normalizeArticleDetail({
      ...options.detail,
      supplements: [...options.detail.supplements, supplement],
    })

    await putArticleDetail(nextDetail)
    return nextDetail
  }

  async function generateArticleBlockTransformation(options: {
    apiKey: string
    model: string
    item: FeedItem
    detail: ArticleDetail
    languagePreset: LanguagePreset
    blockTitle: string
    blockMarkdown: string
    action: 'example' | 'deepen' | 'custom'
    mode: 'append' | 'replace'
    customInstruction?: string
  }): Promise<ArticleBlockTransformationResponse> {
    return requestJson<ArticleBlockTransformationResponse>({
      apiKey: options.apiKey,
      model: options.model,
      systemPrompt: 'You transform a selected article block and return JSON.',
      userPrompt: buildArticleBlockTransformationPrompt({
        item: options.item,
        detail: options.detail,
        languagePreset: options.languagePreset,
        blockTitle: options.blockTitle,
        blockMarkdown: options.blockMarkdown,
        action: options.action,
        mode: options.mode,
        customInstruction: options.customInstruction,
      }),
      temperature: 0.75,
    })
  }

  return {
    generateTopicSuggestions,
    generateFeedBatch,
    generateArticleDetail,
    generateRelatedReads,
    generateExpansionOptions,
    generateArticleSupplement,
    generateArticleBlockTransformation,
  }
}
