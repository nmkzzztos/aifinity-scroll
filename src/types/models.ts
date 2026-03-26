export interface LanguagePreset {
  id: string
  label: string
  description: string
  instruction: string
}

export interface OpenRouterModelPreset {
  id: string
  label: string
  description: string
  icon: string
}

export interface TopicSuggestion {
  id: string
  title: string
  subtitle: string
  whyNow: string
  subtopics: string[]
}

export interface TopicPreference {
  key: string
  label: string
  score: number
  lastLikedAt: string
}

export interface UserProfile {
  apiKey: string
  activeTopic: string
  languagePresetId: string
  customLanguageNote: string
  /** OpenRouter model id used for feed cards and topic suggestions */
  feedModelId: string
  /** OpenRouter model id used for full articles, library AI, and article tools */
  articleModelId: string
  onboardingCompleted: boolean
  suggestions: TopicSuggestion[]
  preferences: TopicPreference[]
  updatedAt: string
}

export interface FeedItem {
  id: string
  batchId: string
  title: string
  tldr: string
  howItWorks: string[]
  whyItMatters: string
  summary: string
  topic: string
  subtopics: string[]
  estimatedReadMinutes: number
  tone: string
  createdAt: string
  liked: boolean
  detailCached: boolean
}

export interface ArticleSection {
  heading: string
  body: string
}

export interface RelatedSuggestion {
  id: string
  title: string
  angle: string
  reason: string
  subtopics: string[]
}

export interface ArticleSupplement {
  id: string
  kind: 'example' | 'topic-expansion' | 'custom'
  title: string
  markdown: string
  createdAt: string
  sourceTopic?: string
  targetBlockId: string
}

export interface ArticleExpansionOption {
  id: string
  label: string
  reason: string
}

export interface ArticleDetail {
  id: string
  feedItemId: string
  title: string
  overview: string
  markdown: string
  sections: ArticleSection[]
  takeaways: string[]
  related: RelatedSuggestion[]
  relatedLoaded: boolean
  supplements: ArticleSupplement[]
  expansionOptions: ArticleExpansionOption[]
  expansionOptionsLoaded: boolean
  generatedAt: string
}

export interface LibraryFolder {
  id: string
  name: string
  description: string
  categories: string[]
  articleIds: string[]
  createdAt: string
  updatedAt: string
}

export interface SavedArticle {
  id: string
  sourceFeedItemId: string
  title: string
  description: string
  folderId: string
  categories: string[]
  savedAt: string
  sourceTopic: string
}

export interface SaveRecommendation {
  mode: 'existing' | 'new'
  folderName: string
  folderDescription: string
  categories: string[]
  rationale: string
}

export interface TopicSuggestionResponse {
  suggestions: Array<{
    title: string
    subtitle: string
    whyNow: string
    subtopics: string[]
  }>
}

export interface FeedBatchResponse {
  items: Array<{
    title: string
    tldr: string
    howItWorks: string[]
    whyItMatters: string
    summary: string
    body: string
    subtopics: string[]
    estimatedReadMinutes: number
    tone: string
  }>
}

export interface ArticleDetailResponse {
  overview: string
  markdown: string
  sections: ArticleSection[]
  takeaways: string[]
}

export interface RelatedSuggestionResponse {
  related: Array<{
    title: string
    angle: string
    reason: string
    subtopics: string[]
  }>
}

export interface ArticleSupplementResponse {
  title: string
  markdown: string
}

export interface ArticleBlockTransformationResponse {
  title: string
  markdown: string
}

export interface ArticleExpansionOptionsResponse {
  options: Array<{
    label: string
    reason: string
  }>
}

export interface SaveRecommendationResponse {
  mode: 'existing' | 'new'
  folderName: string
  folderDescription: string
  categories: string[]
  rationale: string
}
