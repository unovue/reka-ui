import type { MaybeRefOrGetter } from 'vue'
import { onScopeDispose, toValue, watch } from 'vue'

/**
 * Writes a part's `id` prop into the context slot its paired element reads
 * (`aria-controls`, `aria-labelledby`, `aria-describedby`). Base UI parity: the
 * consumer's id wins over the generated one. Applied at setup so the part's
 * first render already uses it, re-applied when the prop changes, and the
 * generated `fallback` is restored once the part unmounts.
 *
 * An empty string counts as no id, like `useId`'s `deterministicId`.
 *
 * @internal
 * @lifecycle setup
 */
export function usePartId(
  id: MaybeRefOrGetter<string | undefined>,
  fallback: string,
  apply: (id: string) => void,
) {
  watch(() => toValue(id) || fallback, apply, { immediate: true })
  onScopeDispose(() => apply(fallback))
}
