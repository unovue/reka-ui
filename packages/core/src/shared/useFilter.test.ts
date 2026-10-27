import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, ref } from 'vue'
import { ConfigProvider } from '@/ConfigProvider'
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

    it('keeps tracking the collator when every item hits the exact-match fast path', () => {
      const options = ref<Intl.CollatorOptions>({ sensitivity: 'variant' })
      const { contains: reactiveContains } = useFilter(options)

      let runs = 0
      const filtered = computed(() => {
        runs++
        return ['cat', 'cart', 'cabin'].filter(item => reactiveContains(item, 'ca'))
      })

      expect(filtered.value).toHaveLength(3)
      expect(runs).toBe(1)

      options.value = { sensitivity: 'base' }
      expect(filtered.value).toHaveLength(3)
      expect(runs).toBe(2)
    })
  })
})

// #2824 item 10: the collator follows the `ConfigProvider` locale instead of a hardcoded `'en'`.
describe('useFilter locale', () => {
  function containsUnder(locale: string | undefined) {
    let contains!: (string: string, substring: string) => boolean
    const Probe = defineComponent({
      setup() {
        contains = useFilter({ sensitivity: 'base' }).contains
        return () => null
      },
    })
    mount(locale ? defineComponent({ setup: () => () => h(ConfigProvider, { locale }, () => h(Probe)) }) : Probe)
    return contains
  }

  it('collates with `en` without a provider', () => {
    // English base sensitivity folds the diaeresis: `ä` matches `a`.
    expect(containsUnder(undefined)('ä', 'a')).toBe(true)
  })

  it('collates with the ConfigProvider locale', () => {
    // Swedish treats `ä` as a letter of its own.
    expect(containsUnder('sv')('ä', 'a')).toBe(false)
    expect(containsUnder('sv')('Ärlig', 'ä')).toBe(true)
  })

  it('keeps `ä` apart from `a` under German search collation', () => {
    // `usage: 'search'`: German search collation keeps the umlaut apart, unlike the default `sort` usage.
    expect(containsUnder('de')('ä', 'a')).toBe(false)
  })

  it('falls back to `en` with a warning for an invalid locale tag instead of throwing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const contains = containsUnder('en_US')
    expect(() => contains('Ärlig', 'a')).not.toThrow()
    expect(contains('Ärlig', 'a')).toBe(true)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid locale "en_US"'), expect.any(RangeError))
    warn.mockRestore()
  })

  it('falls back to `en` outside a component', () => {
    expect(useFilter({ sensitivity: 'base' }).contains('ä', 'a')).toBe(true)
  })
})
