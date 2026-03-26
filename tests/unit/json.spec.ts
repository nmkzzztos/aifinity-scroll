import { describe, expect, it } from 'vitest'

import { extractJsonPayload, parseModelJson } from '@/utils/json'

describe('json helpers', () => {
  it('extracts payload from fenced json', () => {
    const raw = '```json\n{"hello":"world"}\n```'

    expect(extractJsonPayload(raw)).toBe('{"hello":"world"}')
  })

  it('parses inline model json payload', () => {
    const parsed = parseModelJson<{ answer: number }>('prefix {"answer":42} suffix')

    expect(parsed.answer).toBe(42)
  })
})
