import { defineStore } from 'pinia'

import { usePersistentState } from '@/composables/usePersistentState'
import type { LibraryFolder, SavedArticle } from '@/types/models'
import { STORAGE_KEYS } from '@/utils/constants'
import { createId } from '@/utils/id'

interface LibraryState {
  folders: LibraryFolder[]
  articles: SavedArticle[]
}

const initialState: LibraryState = {
  folders: [],
  articles: [],
}

export const useLibraryStore = defineStore('library', {
  state: () => {
    const { readStorage } = usePersistentState()
    return readStorage(STORAGE_KEYS.library, initialState)
  },
  getters: {
    articleCount: (state) => state.articles.length,
  },
  actions: {
    persist() {
      const { writeStorage } = usePersistentState()
      writeStorage(STORAGE_KEYS.library, { ...this.$state })
    },
    ensureFolder(payload: {
      name: string
      description: string
      categories: string[]
    }): string {
      const normalizedName = payload.name.trim()
      const existing = this.folders.find(
        (folder) => folder.name.toLowerCase() === normalizedName.toLowerCase(),
      )

      if (existing) {
        existing.description = payload.description.trim() || existing.description
        existing.categories = Array.from(new Set([...existing.categories, ...payload.categories]))
        existing.updatedAt = new Date().toISOString()
        this.persist()
        return existing.id
      }

      const folder: LibraryFolder = {
        id: createId('folder'),
        name: normalizedName,
        description: payload.description.trim(),
        categories: payload.categories,
        articleIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      this.folders = [folder, ...this.folders]
      this.persist()
      return folder.id
    },
    saveArticleMetadata(payload: Omit<SavedArticle, 'id' | 'savedAt'>): SavedArticle {
      const existing = this.articles.find(
        (article) =>
          article.sourceFeedItemId === payload.sourceFeedItemId && article.folderId === payload.folderId,
      )

      if (existing) {
        existing.title = payload.title
        existing.description = payload.description
        existing.categories = payload.categories
        existing.sourceTopic = payload.sourceTopic
        existing.savedAt = new Date().toISOString()
        this.persist()
        return existing
      }

      const article: SavedArticle = {
        ...payload,
        id: createId('saved'),
        savedAt: new Date().toISOString(),
      }

      this.articles = [article, ...this.articles]

      const folder = this.folders.find((entry) => entry.id === payload.folderId)
      if (folder && !folder.articleIds.includes(article.id)) {
        folder.articleIds.unshift(article.id)
        folder.updatedAt = new Date().toISOString()
      }

      this.persist()
      return article
    },
    clear() {
      Object.assign(this, initialState)
      this.persist()
    },
  },
})
