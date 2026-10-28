import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Direction } from './types'
import { computed, toValue } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'

/**
 * The `inject` fallback, shared rather than a fresh `{ dir: ref('ltr') }` per
 * call: without a `ConfigProvider` the direction falls back to `'ltr'` below.
 */
const NO_CONFIG = Object.freeze({ dir: undefined as Ref<Direction> | undefined })

/**
 * The `useDirection` function provides a way to access the current direction in your application.
 * @param {MaybeRefOrGetter<Direction | undefined>} [dir] - An optional ref (or getter) containing the direction (ltr or rtl).
 * @returns  computed value that combines with the resolved direction.
 */
export function useDirection(dir?: MaybeRefOrGetter<Direction | undefined>) {
  const context = injectConfigProviderContext(NO_CONFIG as unknown as Parameters<typeof injectConfigProviderContext>[0])
  return computed(() => toValue(dir) || context?.dir?.value || 'ltr')
}
