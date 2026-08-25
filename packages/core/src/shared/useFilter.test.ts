import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useFilter } from './useFilter'

describe('useFilter', () => {
  const { startsWith, endsWith, contains } = useFilter()

  describe('startsWith', () => {
    it('matches a prefix', () => {
      expect(startsWith('hello', 'he')).toBe(true)
      expect(startsWith('hello', 'lo')).toBe(false)
    })

    it('treats an empty substring as a match', () => {
      expect(startsWith('hello', '')).toBe(true)
    })

    it('returns false when the substring is longer than the string', () => {
      expect(startsWith('he', 'hello')).toBe(false)
    })
  })

  describe('endsWith', () => {
    it('matches a suffix', () => {
      expect(endsWith('hello', 'lo')).toBe(true)
      expect(endsWith('hello', 'he')).toBe(false)
    })

    it('treats an empty substring as a match', () => {
      expect(endsWith('hello', '')).toBe(true)
    })

    it('returns false when the substring is longer than the string', () => {
      expect(endsWith('lo', 'hello')).toBe(false)
    })
  })

  describe('contains', () => {
    it('matches at the start, middle and end', () => {
      expect(contains('hello', 'he')).toBe(true)
      expect(contains('hello', 'ell')).toBe(true)
      expect(contains('hello', 'lo')).toBe(true)
    })

    it('returns false when absent', () => {
      expect(contains('hello', 'xyz')).toBe(false)
    })

    it('treats an empty substring as a match', () => {
      expect(contains('hello', '')).toBe(true)
    })

    it('returns false when the substring is longer than the string', () => {
      expect(contains('he', 'hello')).toBe(false)
    })

    it('matches an exact whole-string substring', () => {
      expect(contains('hello', 'hello')).toBe(true)
    })

    it('matches across NFC/NFD normalization forms', () => {
      // Precomposed "é" in the haystack, decomposed "e" + U+0301 in the needle.
      expect(contains('café latte', 'café')).toBe(true)
    })
  })

  describe('collator options', () => {
    it('ignores case and accents at base sensitivity', () => {
      const base = useFilter({ sensitivity: 'base' })
      expect(base.contains('Café Latte', 'cafe')).toBe(true)
      expect(base.startsWith('Café', 'CAF')).toBe(true)
      expect(base.endsWith('Café', 'FÉ')).toBe(true)
    })

    it('respects case and accents at variant sensitivity', () => {
      const variant = useFilter({ sensitivity: 'variant' })
      expect(variant.contains('Café Latte', 'cafe')).toBe(false)
      expect(variant.contains('Café Latte', 'Café')).toBe(true)
    })

    it('reacts to reactive options', () => {
      const options = ref<Intl.CollatorOptions>({ sensitivity: 'variant' })
      const { contains: reactiveContains } = useFilter(options)

      expect(reactiveContains('Café', 'cafe')).toBe(false)
      options.value = { sensitivity: 'base' }
      expect(reactiveContains('Café', 'cafe')).toBe(true)
    })
  })
})
