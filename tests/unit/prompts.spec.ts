import { describe, expect, it } from 'vitest'

import { buildFeedBatchPrompt, buildSaveRecommendationPrompt, serializeArticleText } from '@/services/prompts'
import type { ArticleDetail, FeedItem, LanguagePreset } from '@/types/models'

const preset: LanguagePreset = {
  id: 'en',
  label: 'English',
  description: 'English preset',
  instruction: 'Write in English.',
}

const item: FeedItem = {
  id: 'feed_1',
  batchId: 'batch_1',
  title: 'Sparse MoE routers are becoming interpretable',
  tldr: 'Routers pick experts based on token patterns.',
  howItWorks: ['Tokens score experts.', 'Top experts process the token.'],
  whyItMatters: 'It increases capacity without activating the whole model.',
  summary: 'A quick look at how routing patterns expose model specialization.',
  topic: 'Mixture of Experts',
  subtopics: ['Routing', 'Interpretability'],
  estimatedReadMinutes: 3,
  tone: 'Sharp',
  createdAt: '2026-03-26T00:00:00.000Z',
  liked: false,
  detailCached: false,
}

const detail: ArticleDetail = {
  id: 'feed_1',
  feedItemId: 'feed_1',
  title: item.title,
  overview: 'Overview',
  markdown: '## Section\n\nBody text',
  sections: [{ heading: 'Section', body: 'Body text' }],
  takeaways: ['Takeaway'],
  related: [],
  relatedLoaded: false,
  supplements: [],
  expansionOptions: [],
  expansionOptionsLoaded: false,
  generatedAt: '2026-03-26T00:00:00.000Z',
}

describe('prompt builders', () => {
  it('includes personalization and recent-title constraints in the feed prompt', () => {
    const prompt = buildFeedBatchPrompt({
      topic: 'Mixture of Experts',
      languagePreset: preset,
      preferences: 'Routing (1.5)',
      recentTitles: ['Old title'],
    })

    expect(prompt).toContain('Routing (1.5)')
    expect(prompt).toContain('Old title')
    expect(prompt).toContain('Generate 10 distinct feed cards.')
  })

  it('serializes article text for export or saving', () => {
    const text = serializeArticleText(detail)

    expect(text).toContain('Overview')
    expect(text).toContain('Section')
    expect(text).toContain('Body text')
  })

  it('builds a save recommendation prompt using folder context', () => {
    const prompt = buildSaveRecommendationPrompt({
      item,
      detail,
      languagePreset: preset,
      folders: [
        {
          id: 'folder_1',
          name: 'MoE',
          description: 'Mixture-of-experts notes',
          categories: ['systems'],
          articleIds: [],
          createdAt: '',
          updatedAt: '',
        },
      ],
      articles: [
        {
          id: 'saved_1',
          sourceFeedItemId: 'feed_1',
          title: 'Router notes',
          description: 'About expert routing',
          folderId: 'folder_1',
          categories: ['routing'],
          savedAt: '',
          sourceTopic: 'MoE',
        },
      ],
    })

    expect(prompt).toContain('MoE')
    expect(prompt).toContain('Router notes')
    expect(prompt).toContain('personal library')
  })
})
