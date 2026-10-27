import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { computed, onScopeDispose, toValue, watch } from 'vue'

const generatedIds = new WeakMap<object, Record<string, string>>()

/**
 * Records the ids a Root generated for its context's id slots, so `usePartId`
 * can restore them however many parts wrote the slot in between.
 *
 * @internal
 * @lifecycle pure
 */
export function setGeneratedIds<T extends object>(context: T, ids: Partial<Record<keyof T & string, string>>) {
  generatedIds.set(context, ids as Record<string, string>)
}

/**
 * A part's `id` prop, mirrored into the context slot its paired element reads
 * (`aria-controls`, `aria-labelledby`, `aria-describedby`). Base UI parity: the
 * consumer's id wins over the generated one.
 *
 * - The part renders the returned id (its own `id`, else the generated one),
 *   never the slot, so its element does not depend on what another part wrote.
 * - The id is written at setup (the first render already uses it) and again
 *   when the prop changes. A part without an `id` writes nothing.
 * - Removing the prop or unmounting restores the generated id, but only while
 *   the slot still holds this part's id: another part's id is never undone.
 *
 * The generated id comes from `setGeneratedIds()`, else from the slot's value
 * at setup. An empty string counts as no id, like `useId`'s `deterministicId`.
 *
 * @internal
 * @lifecycle setup
 */
export function usePartId<K extends string>(
  id: MaybeRefOrGetter<string | undefined>,
  context: Record<K, string>,
  key: K,
): ComputedRef<string> {
  const generated = generatedIds.get(context)?.[key] ?? context[key]
  // The id this part wrote into the slot, if any.
  let applied: string | undefined

  function release() {
    if (applied !== undefined && context[key] === applied)
      context[key] = generated
    applied = undefined
  }

  watch(() => toValue(id) || undefined, (next) => {
    if (next === applied)
      return
    release()
    if (next) {
      context[key] = next
      applied = next
    }
  }, { immediate: true })
  onScopeDispose(release)

  return computed(() => toValue(id) || generated)
}
