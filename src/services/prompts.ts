import type {
  ArticleDetail,
  ArticleExpansionOption,
  FeedItem,
  LanguagePreset,
  LibraryFolder,
  SavedArticle,
} from '@/types/models'
import { DEFAULT_FEED_BATCH_SIZE } from '@/utils/constants'

/** Shared editorial voice: aligns long-form and cards with hook → context → insight → takeaway. */
function baseInstruction(languagePreset: LanguagePreset, topic: string): string {
  return [
    'You are a sharp research editor writing compact, credible educational content that reads like strong tech journalism, not marketing copy.',
    `Primary topic: ${topic}.`,
    languagePreset.instruction,
    'Arc: lead with curiosity (hook), then why it matters (context), then mechanism or insight, then a concrete takeaway.',
    'Prefer specific nouns, numbers, and mechanisms over vague hype.',
    'Return valid JSON only. No markdown fences.',
  ].join(' ')
}

export function buildTopicSuggestionsPrompt(seed: string, languagePreset: LanguagePreset): string {
  const topicSeed = seed.trim() || 'frontier technology and scientific curiosity'

  return [
    baseInstruction(languagePreset, topicSeed),
    'Generate 6 to 8 distinct study directions for a curious learner.',
    'Each direction should feel like a compelling stream of mini-news and research discoveries.',
    'title: punchy and specific; keep under ~60 characters when possible (readable in lists).',
    'subtitle: one line that expands the angle without repeating the title.',
    'whyNow: tie to a current trend, open question, or recent breakthrough—why click today.',
    'subtopics: two concrete hooks (mechanisms, debates, or applications) the feed could explore.',
    'Response JSON schema:',
    '{"suggestions":[{"title":"string","subtitle":"string","whyNow":"string","subtopics":["string","string"]}]}',
  ].join(' ')
}

export function buildFeedBatchPrompt(options: {
  topic: string
  languagePreset: LanguagePreset
  preferences: string
  recentTitles: string[]
  cardCount?: number
}): string {
  const recentTitlesText = options.recentTitles.length
    ? options.recentTitles.join(' | ')
    : 'None yet'

  const cardCount = options.cardCount ?? DEFAULT_FEED_BATCH_SIZE

  return [
    baseInstruction(options.languagePreset, options.topic),
    `Generate exactly ${cardCount} distinct feed cards.`,
    'Each item must feel like a fresh, self-contained mini-article in a research digest.',
    'Each card must help a user understand the mechanism quickly without deep prior context.',
    'Structure each card like a micro-post: tldr = hook + gist in one or two sentences; howItWorks = 2–3 bullets that explain the mechanism or causal chain; whyItMatters = stakes or implication in one tight sentence.',
    'title: specific; weave the main idea naturally (SEO-friendly without keyword stuffing).',
    'summary: one scannable line; body: 2–3 denser sentences that deepen the teaser (problem → insight → implication).',
    'subtopics: branching angles for follow-up reading; tone: one word or short phrase describing voice (e.g. analytical, exploratory).',
    `Personalization signal: ${options.preferences}.`,
    `Avoid repeating or closely paraphrasing these recent titles: ${recentTitlesText}.`,
    'Response JSON schema:',
    '{"items":[{"title":"string","tldr":"string","howItWorks":["string"],"whyItMatters":"string","summary":"string","body":"string","subtopics":["string"],"estimatedReadMinutes":3,"tone":"string"}]}',
  ].join(' ')
}

export function buildArticleDetailPrompt(options: {
  item: FeedItem
  languagePreset: LanguagePreset
  preferences: string
}): string {
  return [
    baseInstruction(options.languagePreset, options.item.topic),
    `Expand this feed item into a deeper article: ${options.item.title}.`,
    `Existing TL;DR: ${options.item.tldr}.`,
    `How it works bullets: ${options.item.howItWorks.join(' | ')}.`,
    `Existing summary: ${options.item.summary}.`,
    `User interest signal: ${options.preferences}.`,
    'Long-form shape (blog-style): open with a hook (question, striking fact, or crisp problem statement in 2–3 sentences), then context (why this matters), then 3–5 main sections with ## headings (the “solution” or core explanation), then a practical angle (how it shows up in the real world or how to reason about it), then a short closing that ties threads together.',
    'overview: 1–2 sentences; make the main topic clear in the first sentence for skim readers. Aim for ~150–160 characters if it fits naturally (meta-description style).',
    'markdown: the full article body following the structure above; weave the main topic naturally a few times without stuffing.',
    'sections: mirror the ## outline with heading + body per section for structured UI; keep bodies substantive.',
    'takeaways: at most 3 bullets—actionable or memorable; the last can be a soft CTA (what to read, try, or watch next conceptually—no external links required).',
    'Return a clean long-form explanation as markdown, not as plain prose.',
    'Use headings, bullet lists, numbered steps, short examples, and LaTeX formulas only when they actually clarify the concept.',
    'Use real markdown line breaks and blank lines, not literal \\n sequences inside the text.',
    'Every inline math expression must be wrapped in single dollar delimiters like $a^2+b^2=c^2$.',
    'Every block formula must be wrapped in double dollar delimiters like $$y = Wx + b$$.',
    'Any multiline formula, matrix, aligned derivation, or \\begin{...} / \\end{...} environment must be wrapped inside $$...$$.',
    'Never output raw LaTeX commands such as \\mathbf{v} or \\dots in plain text outside math delimiters.',
    'Escape backslashes correctly for JSON strings so markdown and LaTeX survive parsing.',
    'Do not include related next reads in this response.',
    'Response JSON schema:',
    '{"overview":"string","markdown":"string","sections":[{"heading":"string","body":"string"}],"takeaways":["string"]}',
  ].join(' ')
}

export function buildRelatedReadsPrompt(options: {
  item: FeedItem
  detail: ArticleDetail
  languagePreset: LanguagePreset
  preferences: string
}): string {
  return [
    baseInstruction(options.languagePreset, options.item.topic),
    `The user has already read this article: ${options.item.title}.`,
    `Article overview: ${options.detail.overview}.`,
    `Current personalization signal: ${options.preferences}.`,
    'Generate 3 related next reads that branch naturally from the article without repeating it.',
    'Each item should feel like the next chapter: a distinct question, method, or controversy.',
    'title: specific and enticing; angle: one line on what is different from the piece they just read; reason: why this follow-up fits their path; subtopics: 2–4 hooks for future cards.',
    'Response JSON schema:',
    '{"related":[{"title":"string","angle":"string","reason":"string","subtopics":["string"]}]}',
  ].join(' ')
}

export function buildArticleExpansionOptionsPrompt(options: {
  item: FeedItem
  detail: ArticleDetail
  languagePreset: LanguagePreset
}): string {
  return [
    baseInstruction(options.languagePreset, options.item.topic),
    `The user is reading: ${options.item.title}.`,
    `Current article overview: ${options.detail.overview}.`,
    'Suggest 4 concrete extra directions that would deepen this article from inside the same topic.',
    'Make them feel like optional expansions (new section or deep dive), not unrelated articles.',
    'label: short button-style title; reason: one sentence on what new ground this adds (mechanism, edge case, history, or comparison).',
    'Response JSON schema:',
    '{"options":[{"label":"string","reason":"string"}]}',
  ].join(' ')
}

export function buildArticleSupplementPrompt(options: {
  item: FeedItem
  detail: ArticleDetail
  languagePreset: LanguagePreset
  kind: 'example' | 'topic-expansion'
  selectedOption?: ArticleExpansionOption
}): string {
  const kindInstruction =
    options.kind === 'example'
      ? 'Add one strong worked example: set up a minimal scenario, walk through steps or reasoning, end with what the reader should notice—without repeating the whole article.'
      : `Expand the article with a focused new section about: ${options.selectedOption?.label}. Reason: ${options.selectedOption?.reason}.`

  return [
    baseInstruction(options.languagePreset, options.item.topic),
    `Current article title: ${options.item.title}.`,
    `Current article overview: ${options.detail.overview}.`,
    kindInstruction,
    'Return only the add-on section as markdown, not the whole article again.',
    'Start with a ## heading; use lists or formulas only when they clarify.',
    'Response JSON schema:',
    '{"title":"string","markdown":"string"}',
  ].join(' ')
}

export function buildArticleBlockTransformationPrompt(options: {
  item: FeedItem
  detail: ArticleDetail
  languagePreset: LanguagePreset
  blockTitle: string
  blockMarkdown: string
  action: 'example' | 'deepen' | 'custom'
  mode: 'append' | 'replace'
  customInstruction?: string
}): string {
  const actionInstruction =
    options.action === 'example'
      ? 'Generate one crisp worked example for this exact block: scenario → steps or derivation → takeaway.'
      : options.action === 'deepen'
        ? 'Rewrite this exact block so it becomes more rigorous and complete: add missing definitions, edge cases, or intuition; keep the same core claim unless fixing an error.'
        : `Apply this user request to the block: ${options.customInstruction ?? 'Improve the block.'}`

  const modeInstruction =
    options.mode === 'replace'
      ? 'Return a replacement for the selected block only.'
      : 'Return an additional add-on block that should appear right after the selected block.'

  return [
    baseInstruction(options.languagePreset, options.item.topic),
    `Current article title: ${options.item.title}.`,
    `Current article overview: ${options.detail.overview}.`,
    `Selected block title: ${options.blockTitle}.`,
    `Selected block markdown:\n${options.blockMarkdown}`,
    actionInstruction,
    modeInstruction,
    'Return only markdown for the targeted block content, not the whole article.',
    'If replacing an existing headed section, include the heading again in the returned markdown.',
    'If appending, create a self-contained markdown block with its own heading when appropriate.',
    'Match the article tone: clear, educational, no filler.',
    'Response JSON schema:',
    '{"title":"string","markdown":"string"}',
  ].join('\n\n')
}

export function buildSaveRecommendationPrompt(options: {
  item: FeedItem
  detail: ArticleDetail | null
  languagePreset: LanguagePreset
  folders: LibraryFolder[]
  articles: SavedArticle[]
}): string {
  const folderDigest = options.folders.length
    ? options.folders
        .map((folder) => {
          const articleDigest = options.articles
            .filter((article) => article.folderId === folder.id)
            .slice(0, 6)
            .map((article) => `${article.title}: ${article.description}`)
            .join(' || ')

          return `${folder.name} -> ${folder.description}. Articles: ${articleDigest || 'none'}`
        })
        .join(' ### ')
    : 'No folders yet.'

  return [
    baseInstruction(options.languagePreset, options.item.topic),
    'Recommend how this article should be saved in a personal library for easy rediscovery.',
    `Article title: ${options.item.title}.`,
    `Article summary: ${options.item.summary}.`,
    `Detailed overview: ${options.detail?.overview ?? 'No detailed article generated yet.'}`,
    `Existing folders and article summaries: ${folderDigest}`,
    'Choose whether this article belongs in an existing folder or needs a new one; prefer existing folders when the fit is strong.',
    'categories: 2–4 short labels (like tags) that reflect topic, method, or domain—useful for scanning.',
    'folderName and folderDescription: only if mode implies a new folder; keep names specific and human-readable.',
    'rationale: one or two sentences on why this placement helps the user later.',
    'Response JSON schema:',
    '{"mode":"existing"|"new","folderName":"string","folderDescription":"string","categories":["string"],"rationale":"string"}',
  ].join(' ')
}

export function serializeArticleText(detail: ArticleDetail): string {
  if (detail.markdown.trim()) {
    const supplements = detail.supplements
      .map((supplement) => `## ${supplement.title}\n\n${supplement.markdown}`)
      .join('\n\n')

    return [detail.title, detail.overview, detail.markdown, supplements].filter(Boolean).join('\n\n')
  }

  return [
    detail.title,
    detail.overview,
    ...detail.sections.map((section) => `${section.heading}\n${section.body}`),
    `Takeaways: ${detail.takeaways.join('; ')}`,
  ].join('\n\n')
}
