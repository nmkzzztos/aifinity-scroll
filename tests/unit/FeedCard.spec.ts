import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FeedCard from '@/components/feed/FeedCard.vue'
import type { FeedItem } from '@/types/models'

const item: FeedItem = {
  id: 'feed_1',
  batchId: 'batch_1',
  title: 'Test title',
  tldr: 'Short mechanism summary',
  howItWorks: ['Step one', 'Step two'],
  whyItMatters: 'This matters for scaling.',
  summary: 'Test summary',
  topic: 'Topic',
  subtopics: ['One', 'Two'],
  estimatedReadMinutes: 4,
  tone: 'Fresh',
  createdAt: '2026-03-26T00:00:00.000Z',
  liked: false,
  detailCached: false,
}

describe('FeedCard', () => {
  it('emits open, like, and save actions', async () => {
    const wrapper = mount(FeedCard, {
      props: { item },
    })

    await wrapper.findAll('button')[0]?.trigger('click')
    await wrapper.findAll('button')[1]?.trigger('click')
    await wrapper.findAll('button')[2]?.trigger('click')

    expect(wrapper.emitted('open')?.[0]).toEqual(['feed_1'])
    expect(wrapper.emitted('like')?.[0]).toEqual(['feed_1'])
    expect(wrapper.emitted('save')?.[0]).toEqual(['feed_1'])
  })
})
