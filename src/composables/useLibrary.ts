import { useOpenRouter } from '@/composables/useOpenRouter'
import { putSavedArticleBody } from '@/services/db'
import { buildSaveRecommendationPrompt, serializeArticleText } from '@/services/prompts'
import { useLibraryStore } from '@/stores/library'
import type {
  ArticleDetail,
  FeedItem,
  LanguagePreset,
  SaveRecommendation,
  SaveRecommendationResponse,
} from '@/types/models'

export function useLibrary() {
  const libraryStore = useLibraryStore()
  const { requestJson } = useOpenRouter()

  async function recommendSave(options: {
    apiKey: string
    model: string
    item: FeedItem
    detail: ArticleDetail | null
    languagePreset: LanguagePreset
  }): Promise<SaveRecommendation> {
    const response = await requestJson<SaveRecommendationResponse>({
      apiKey: options.apiKey,
      model: options.model,
      systemPrompt: 'You organize articles into a clean personal knowledge library as JSON.',
      userPrompt: buildSaveRecommendationPrompt({
        item: options.item,
        detail: options.detail,
        languagePreset: options.languagePreset,
        folders: libraryStore.folders,
        articles: libraryStore.articles,
      }),
      temperature: 0.35,
    })

    return {
      mode: response.mode === 'new' ? 'new' : 'existing',
      folderName: response.folderName,
      folderDescription: response.folderDescription,
      categories: response.categories ?? [],
      rationale: response.rationale,
    }
  }

  async function saveArticle(options: {
    item: FeedItem
    detail: ArticleDetail | null
    title: string
    description: string
    folderId?: string
    newFolderName?: string
    newFolderDescription?: string
    categories: string[]
  }) {
    const folder = options.folderId
      ? libraryStore.folders.find((entry) => entry.id === options.folderId) ?? null
      : null

    const ensuredFolderId =
      folder?.id ??
      libraryStore.ensureFolder({
        name: options.newFolderName?.trim() || options.item.topic,
        description: options.newFolderDescription?.trim() || `Saved ideas around ${options.item.topic}.`,
        categories: options.categories,
      })

    const saved = libraryStore.saveArticleMetadata({
      sourceFeedItemId: options.item.id,
      title: options.title.trim() || options.item.title,
      description: options.description.trim() || options.item.summary,
      folderId: ensuredFolderId,
      categories: options.categories,
      sourceTopic: options.item.topic,
    })

    if (options.detail) {
      await putSavedArticleBody({
        id: saved.id,
        detail: options.detail,
        text: serializeArticleText(options.detail),
      })
    }

    return saved
  }

  return {
    recommendSave,
    saveArticle,
  }
}
