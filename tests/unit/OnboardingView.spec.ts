import { createPinia, setActivePinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'

import OnboardingView from '@/views/OnboardingView.vue'
import { useProfileStore } from '@/stores/profile'

const generateTopicSuggestions = vi.fn()

vi.mock('@/composables/useFeedGenerator', () => ({
  useFeedGenerator: () => ({
    generateTopicSuggestions,
  }),
}))

describe('OnboardingView', () => {
  beforeEach(() => {
    generateTopicSuggestions.mockReset()
  })

  it('saves onboarding state and navigates to feed', async () => {
    generateTopicSuggestions.mockResolvedValue([
      {
        id: 'topic_1',
        title: 'Neural System Design',
        subtitle: 'subtitle',
        whyNow: 'because',
        subtopics: ['sparsity'],
      },
    ])

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/onboarding', component: OnboardingView },
        { path: '/feed', component: { template: '<div>feed</div>' } },
      ],
    })
    const pinia = createPinia()

    setActivePinia(pinia)

    router.push('/onboarding')
    await router.isReady()

    const wrapper = mount(OnboardingView, {
      global: {
        plugins: [pinia, router],
      },
    })

    await wrapper.find('input[type="password"]').setValue('demo-key')
    await wrapper.find('textarea').setValue('Neural systems')
    await wrapper.findAll('button').find((button) => button.text() === 'Suggest directions')?.trigger('click')
    await flushPromises()

    await wrapper.findAll('button').find((button) => button.text() === 'Enter feed')?.trigger('click')
    await flushPromises()

    const profileStore = useProfileStore()

    expect(generateTopicSuggestions).toHaveBeenCalled()
    expect(profileStore.activeTopic).toBeTruthy()
    expect(router.currentRoute.value.fullPath).toBe('/feed')
  })
})
