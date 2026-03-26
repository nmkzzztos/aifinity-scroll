import { describe, expect, it } from 'vitest'

import { usePersonalization } from '@/composables/usePersonalization'
import type { FeedItem } from '@/types/models'

const sampleItem: FeedItem = {
  id: 'feed_1',
  batchId: 'batch_1',
  title: 'Router behavior',
  tldr: 'Routers choose experts.',
  howItWorks: ['Compute scores', 'Dispatch to top experts'],
  whyItMatters: 'Keeps compute sparse.',
  summary: 'Summary',
  topic: 'Mixture of Experts',
  subtopics: ['Routing', 'Capacity'],
  estimatedReadMinutes: 4,
  tone: 'Fresh',
  createdAt: '2026-03-26T00:00:00.000Z',
  liked: false,
  detailCached: false,
}

describe('usePersonalization', () => {
  it('promotes topic and subtopics after a like', () => {
    const { applyLikeSignal, preferenceDigest } = usePersonalization()

    const next = applyLikeSignal([], sampleItem, true)

    expect(next[0]?.label).toBe('Mixture of Experts')
    expect(next.map((entry) => entry.label)).toContain('Routing')
    expect(preferenceDigest(next)).toContain('Mixture of Experts')
  })

  it('removes low-signal preferences after unlike', () => {
    const { applyLikeSignal } = usePersonalization()
    const liked = applyLikeSignal([], sampleItem, true)
    const unliked = applyLikeSignal(liked, sampleItem, false)

    expect(unliked.every((entry) => entry.score > 0)).toBe(true)
  })
})
