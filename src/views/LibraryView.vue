<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'

import LibraryFolderPills from '@/components/library/LibraryFolderPills.vue'
import { useLibraryStore } from '@/stores/library'

const router = useRouter()
const libraryStore = useLibraryStore()
const activeFolderId = shallowRef('all')
const query = shallowRef('')

const visibleArticles = computed(() => {
  const search = query.value.trim().toLowerCase()

  return libraryStore.articles.filter((article) => {
    const matchesFolder = activeFolderId.value === 'all' || article.folderId === activeFolderId.value
    const haystack = `${article.title} ${article.description} ${article.categories.join(' ')}`.toLowerCase()
    const matchesQuery = !search || haystack.includes(search)
    return matchesFolder && matchesQuery
  })
})

function openArticle(sourceFeedItemId: string) {
  router.push(`/article/${sourceFeedItemId}`)
}
</script>

<template>
  <section class="page">
    <header class="page__hero page__hero--compact">
      <p class="eyebrow">Library</p>
      <h1>Your saved article system.</h1>
      <p class="lede">Folders are local, searchable, and shaped by your own naming or the model's suggestion.</p>
    </header>

    <section class="panel panel--compact">
      <label class="field">
        <span>Search saved articles</span>
        <input v-model="query" class="input" type="search" placeholder="Search titles, notes, categories" />
      </label>
      <LibraryFolderPills
        :folders="libraryStore.folders"
        :active-folder-id="activeFolderId"
        @select="activeFolderId = $event"
      />
    </section>

    <section class="stack">
      <article v-for="article in visibleArticles" :key="article.id" class="panel panel--article">
        <div class="article-meta">
          <span>{{ libraryStore.folders.find((folder) => folder.id === article.folderId)?.name ?? 'Unsorted' }}</span>
          <span>{{ article.savedAt.slice(0, 10) }}</span>
        </div>
        <h2>{{ article.title }}</h2>
        <p>{{ article.description }}</p>
        <p v-if="article.categories.length" class="status">{{ article.categories.join(' · ') }}</p>
        <button class="button button--muted" type="button" @click="openArticle(article.sourceFeedItemId)">
          Open article
        </button>
      </article>

      <p v-if="!visibleArticles.length" class="status">Nothing saved yet. Use “Save” from the feed or article view.</p>
    </section>
  </section>
</template>
