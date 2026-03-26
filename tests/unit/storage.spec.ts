import { describe, expect, it } from 'vitest'

import { readStorage, removeStorage, writeStorage } from '@/composables/usePersistentState'

describe('persistent state helpers', () => {
  it('writes and reads JSON values from localStorage', () => {
    writeStorage('demo', { hello: 'world' })

    expect(readStorage('demo', null as { hello: string } | null)).toEqual({ hello: 'world' })
  })

  it('returns fallback after removal', () => {
    writeStorage('demo', { hello: 'world' })
    removeStorage('demo')

    expect(readStorage('demo', { fallback: true })).toEqual({ fallback: true })
  })
})
