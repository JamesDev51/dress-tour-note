import { sanitizeFilename, stableStringify } from './utils'

describe('shared utilities', () => {
  it('creates stable JSON regardless of object insertion order', () => {
    expect(stableStringify({ b: 2, a: { d: 4, c: 3 } })).toBe('{"a":{"c":3,"d":4},"b":2}')
  })

  it('removes operating-system forbidden filename characters', () => {
    expect(sanitizeFilename('히똥:드레스/투어?')).toBe('히똥드레스투어')
  })
})
