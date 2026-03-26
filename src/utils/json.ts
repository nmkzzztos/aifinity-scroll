export function extractJsonPayload(raw: string): string {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const firstBrace = raw.indexOf('{')
  const lastBrace = raw.lastIndexOf('}')

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return raw.slice(firstBrace, lastBrace + 1)
  }

  throw new Error('Model response did not contain valid JSON.')
}

export function parseModelJson<T>(raw: string): T {
  const payload = extractJsonPayload(raw)
  return JSON.parse(payload) as T
}
