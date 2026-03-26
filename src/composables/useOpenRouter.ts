import { callOpenRouter } from '@/services/openrouter'
import { parseModelJson } from '@/utils/json'

export function useOpenRouter() {
  async function requestJson<T>(options: {
    apiKey: string
    model: string
    systemPrompt: string
    userPrompt: string
    temperature?: number
  }): Promise<T> {
    const raw = await callOpenRouter({
      apiKey: options.apiKey,
      model: options.model,
      temperature: options.temperature,
      messages: [
        {
          role: 'system',
          content: options.systemPrompt,
        },
        {
          role: 'user',
          content: options.userPrompt,
        },
      ],
    })

    return parseModelJson<T>(raw)
  }

  return {
    requestJson,
  }
}
