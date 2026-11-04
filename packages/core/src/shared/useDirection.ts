import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { Direction } from './types'
import { getCurrentInstance, toValue } from 'vue'
import { injectConfigProviderContext } from '@/ConfigProvider/ConfigProvider.vue'
import { getterRef } from './partSurface'

function injectConfigDir() {
  // Outside a component `inject` would only warn and miss.
  // The `null` fallback: without a `ConfigProvider` the direction is `'ltr'`.
  return getCurrentInstance() ? injectConfigProviderContext(null)?.dir : undefined
}

/**
 * An uncached readonly ref over `dir`, then `fallback`, then `'ltr'`: the lookup
 * is two reads, and a `computed` per instance would keep a value and dependency
 * links alive in every family that reads the direction.
 */
function directionRef(dir: MaybeRefOrGetter<Direction | undefined>, fallback: Ref<Direction> | undefined) {
  return getterRef<Direction>(() => toValue(dir) || fallback?.value || 'ltr')
}

/**
 * The `useDirection` function provides a way to access the current direction in your application.
 * @param {MaybeRefOrGetter<Direction | undefined>} [dir] - An optional ref (or getter) containing the direction (ltr or rtl).
 * @returns  computed value that combines with the resolved direction.
 */
export function useDirection(dir?: MaybeRefOrGetter<Direction | undefined>): ComputedRef<Direction> {
  return directionRef(dir, injectConfigDir())
}

/**
 * The `ConfigProvider` direction a headless composable's `dir` option falls
 * back to, or `undefined` when the option already resolves at setup.
 *
 * Components hand their composable an already resolved `useDirection()` ref,
 * so this injects only when the option is empty: a component reads the
 * context once. Use it directly where the direction is read rarely enough
 * that a ref per instance isn't worth keeping.
 */
export function injectDirectionFallback(dir: MaybeRefOrGetter<Direction | undefined>): Ref<Direction> | undefined {
  return toValue(dir) ? undefined : injectConfigDir()
}

/**
 * A headless composable's `dir` option, resolved like a component's: the
 * option, then the nearest `ConfigProvider`, then `'ltr'`.
 */
export function resolveDirection(dir: MaybeRefOrGetter<Direction | undefined>): ComputedRef<Direction> {
  return directionRef(dir, injectDirectionFallback(dir))
}
