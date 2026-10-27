import type { MaybeRef } from 'vue'
import { computed, hasInjectionContext, unref } from 'vue'
import { useLocale } from './useLocale'

/**
 * Provides locale-aware string filtering functions.
 * Uses `Intl.Collator` for comparison to ensure proper Unicode handling.
 *
 * The collator uses the `ConfigProvider` locale (`useLocale()`, #2824 item 10).
 * Outside a component `setup()` there is no provider to read, so it falls back to `'en'`.
 *
 * @param options - Optional collator options to customize comparison behavior.
 *   See [Intl.CollatorOptions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator#options) for details.
 * @returns An object with methods to check if a string starts with, ends with, or contains a substring.
 *
 * @example
 * const { startsWith, endsWith, contains } = useFilter();
 *
 * startsWith('hello', 'he'); // true
 * endsWith('hello', 'lo'); // true
 * contains('hello', 'ell'); // true
 */
export function useFilter(options?: MaybeRef<Intl.CollatorOptions>) {
  const computedOptions = computed(() => unref(options))
  const locale = hasInjectionContext() ? useLocale() : computed(() => 'en')
  const collator = computed(() => new Intl.Collator(locale.value, { usage: 'search', ...computedOptions.value }))

  const startsWith = (string: string, substring: string) => {
    if (substring.length === 0)
      return true

    string = string.normalize('NFC')
    substring = substring.normalize('NFC')
    return collator.value.compare(string.slice(0, substring.length), substring) === 0
  }

  const endsWith = (string: string, substring: string) => {
    if (substring.length === 0)
      return true

    string = string.normalize('NFC')
    substring = substring.normalize('NFC')
    return collator.value.compare(string.slice(-substring.length), substring) === 0
  }

  const contains = (string: string, substring: string) => {
    if (substring.length === 0)
      return true

    string = string.normalize('NFC')
    substring = substring.normalize('NFC')

    if (substring.length > string.length)
      return false

    // Read before the fast path below, so callers inside an effect keep tracking the collator.
    const compare = collator.value.compare

    // Identical strings always collate equal, so an exact match short-circuits the scan.
    if (string.includes(substring))
      return true

    const sliceLen = substring.length
    for (let scan = 0; scan + sliceLen <= string.length; scan++) {
      if (compare(substring, string.slice(scan, scan + sliceLen)) === 0)
        return true
    }

    return false
  }

  return {
    startsWith,
    endsWith,
    contains,
  }
}
