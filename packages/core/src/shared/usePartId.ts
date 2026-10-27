import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import { computed, onScopeDispose, toValue, watch } from 'vue'

const generatedIds = new WeakMap<object, Record<string, string>>()
/** Per context and slot: the mounted parts' ids, in the order they claimed the slot. */
const slotClaims = new WeakMap<object, Map<string, Array<{ id: string }>>>()

/**
 * Records the ids a Root generated for its context's id slots, so `usePartId`
 * can fall back to them however many parts wrote the slot in between.
 *
 * @internal
 * @lifecycle pure
 */
export function setGeneratedIds<T extends object>(context: T, ids: Partial<Record<keyof T & string, string>>) {
  generatedIds.set(context, { ...generatedIds.get(context), ...ids } as Record<string, string>)
}

/**
 * The id recorded with `setGeneratedIds()` for a context slot, if any.
 *
 * @internal
 */
export function getGeneratedId(context: object, key: string): string | undefined {
  return generatedIds.get(context)?.[key]
}

function getClaims(context: object, key: string) {
  let slots = slotClaims.get(context)
  if (!slots)
    slotClaims.set(context, slots = new Map())
  let claims = slots.get(key)
  if (!claims)
    slots.set(key, claims = [])
  return claims
}

/**
 * A part's `id` prop, mirrored into the context slot its paired element reads
 * (`aria-controls`, `aria-labelledby`, `aria-describedby`). Base UI parity: the
 * consumer's id wins over the generated one.
 *
 * - The part renders the returned id (its own `id`, else the generated one),
 *   never the slot, so its element does not depend on what another part wrote.
 * - Every mounted part with an `id` claims the slot; the slot holds the id of
 *   the latest claim still mounted, else the generated id. So removing a prop
 *   or unmounting a part hands the slot back to a remaining part's id (or the
 *   generated one), never to a stale value. Id-less parts claim nothing.
 * - The id is written at setup, so the first render already uses it.
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
  const generated = getGeneratedId(context, key) ?? context[key]
  const claims = getClaims(context, key)
  const claim = { id: '' }

  function sync() {
    const next = claims.at(-1)?.id ?? generated
    if (context[key] !== next)
      context[key] = next
  }
  // Only a part that holds a claim touches the slot: an id-less part leaves
  // whatever is there (another part's id, or one a composable caller set).
  function release() {
    const index = claims.indexOf(claim)
    if (index === -1)
      return
    claims.splice(index, 1)
    sync()
  }

  watch(() => toValue(id) || undefined, (next) => {
    if (!next)
      return release()
    claim.id = next
    if (!claims.includes(claim))
      claims.push(claim)
    sync()
  }, { immediate: true })
  onScopeDispose(release)

  return computed(() => toValue(id) || generated)
}
