import { createRouter, createWebHistory } from 'vue-router'

import { readStorage } from '@/composables/usePersistentState'
import { STORAGE_KEYS } from '@/utils/constants'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/feed',
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
      meta: { showNav: false },
    },
    {
      path: '/feed',
      name: 'feed',
      component: () => import('@/views/FeedView.vue'),
      meta: { showNav: true },
    },
    {
      path: '/article/:id',
      name: 'article',
      component: () => import('@/views/ArticleView.vue'),
      meta: { showNav: false },
    },
    {
      path: '/library',
      name: 'library',
      component: () => import('@/views/LibraryView.vue'),
      meta: { showNav: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { showNav: true },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const profile = readStorage(STORAGE_KEYS.profile, null as {
    apiKey?: string
    activeTopic?: string
    onboardingCompleted?: boolean
  } | null)

  const isReady = Boolean(profile?.apiKey && profile?.activeTopic && profile?.onboardingCompleted)

  if (!isReady && to.name !== 'onboarding') {
    return { name: 'onboarding' }
  }

  if (isReady && to.name === 'onboarding') {
    return { name: 'feed' }
  }

  return true
})

export default router
