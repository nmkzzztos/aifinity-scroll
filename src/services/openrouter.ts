import { APP_NAME } from '@/utils/constants'

interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

interface RequestOptions {
  apiKey: string
  model: string
  messages: ChatMessage[]
  temperature?: number
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

export async function callOpenRouter({
  apiKey,
  model,
  messages,
  temperature = 0.9,
}: RequestOptions): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': APP_NAME,
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: 'json_object' },
      messages,
    }),
  })

  const payload = (await response.json()) as OpenRouterResponse

  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'OpenRouter request failed.')
  }

  const content = payload.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('OpenRouter returned an empty response.')
  }

  return content
}
