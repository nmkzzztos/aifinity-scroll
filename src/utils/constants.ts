import type { LanguagePreset, OpenRouterModelPreset } from '@/types/models'

import geminiIcon from '@/assets/icons/gemini.svg'
import inceptionIcon from '@/assets/icons/inception.svg'
import openaiIcon from '@/assets/icons/openai.svg'

export const APP_NAME = 'Infinity Scroll'

export const DEFAULT_FEED_MODEL = 'inception/mercury-2'
export const DEFAULT_ARTICLE_MODEL = 'inception/mercury-2'

export const OPENROUTER_MODEL_PRESETS: OpenRouterModelPreset[] = [
  {
    id: 'inception/mercury-2',
    label: 'Mercury 2',
    description: 'Fast default for cards and structured JSON.',
    icon: inceptionIcon,
  },
  {
    id: 'google/gemini-3-flash-preview',
    label: 'Gemini 3 Flash',
    description: 'Google preview: quick reasoning and broad context.',
    icon: geminiIcon,
  },
  {
    id: 'google/gemini-3.1-flash-lite-preview',
    label: 'Gemini 3.1 Flash Lite',
    description: 'Lighter Gemini flash for high-volume feed generation.',
    icon: geminiIcon,
  },
  {
    id: 'openai/gpt-oss-120b',
    label: 'GPT-OSS 120B',
    description: 'Open-weight OpenAI stack for long-form reasoning.',
    icon: openaiIcon,
  },
]

export const DEFAULT_FEED_BATCH_SIZE = 3

export const STORAGE_KEYS = {
  profile: 'infinity-scroll/profile',
  feed: 'infinity-scroll/feed',
  library: 'infinity-scroll/library',
} as const

export const LANGUAGE_PRESETS: LanguagePreset[] = [
  {
    id: 'en-research',
    label: 'English Research',
    description: 'Clear English feed with precise technical vocabulary and concise summaries.',
    instruction:
      'Write the content in English. Keep the tone crisp, contemporary, and technically literate.',
  },
  {
    id: 'ru-hybrid',
    label: 'Russian Hybrid',
    description: 'Russian explanations with natural English technical terms where they make sense.',
    instruction:
      'Write in Russian, but keep important English technical terms when that improves clarity.',
  },
  {
    id: 'bilingual-mentor',
    label: 'Bilingual Mentor',
    description: 'English-first content with occasional Russian clarification for hard concepts.',
    instruction:
      'Write in English, and add short Russian clarifications only when a concept benefits from it.',
  },
]
