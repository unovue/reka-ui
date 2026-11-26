import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import { getCurrentInstance, onBeforeUpdate, onMounted, onScopeDispose, onUpdated, toValue, watch } from 'vue'
import { getterRef } from './partSurface'

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
 * (`aria-controls`, `aria-labelledby`, `aria-describedby`). The
 * consumer's id wins over the generated one.
 *
 * - The part renders the returned id (its own `id`, else the generated one),
 *   never the slot, so its element does not depend on what another part wrote.
 * - Every mounted part with an `id` claims the slot; the slot holds the id of
 *   the first claim still mounted, else the generated id. So removing a prop
 *   or unmounting a part hands the slot to the next part's id (or the
 *   generated one), never to a stale value. Id-less parts claim nothing.
 * - The id is written at setup, so the first render already uses it.
 * - With `element` (the part's rendered element), an `id` the element renders
 *   other than the one the part passes is claimed once rendered: with `asChild`,
 *   an `id` on the child element wins over the one passed down.
 *
 * The generated id comes from `setGeneratedIds()`, else from the slot's value
 * at setup. An empty string counts as no id, like `useId`'s `deterministicId`.
 *
 * @internal
 * @lifecycle setup
 */
/**
 * Whether the part in setup may render an element id other than the one it passes: one
 * that renders another element (`asChild`, `as="template"`, a component as `as`), or one
 * that hydrates server HTML, whose element keeps the id the server rendered.
 *
 * @internal
 */
export function rendersForeignId() {
  const instance = getCurrentInstance()
  if (!instance)
    return true
  const { as, asChild } = instance.props as { as?: unknown, asChild?: boolean }
  // Hydration assigns the server element to the vnode before the component's setup runs.
  return !!instance.vnode?.el || !!asChild || as === 'template' || (as != null && typeof as !== 'string')
}

export function usePartId<K extends string>(
  id: MaybeRefOrGetter<string | undefined>,
  context: Record<K, string>,
  key: K,
  element?: Readonly<Ref<Element | null | undefined>>,
): ComputedRef<string> {
  const generated = getGeneratedId(context, key) ?? context[key]
  // Allocated on the first claim: most parts never get an `id` prop.
  let claim: { id: string } | undefined

  function sync(claims: Array<{ id: string }>) {
    const next = claims[0]?.id ?? generated
    if (context[key] !== next)
      context[key] = next
  }

  function release() {
    if (!claim)
      return
    const claims = getClaims(context, key)
    const index = claims.indexOf(claim)
    if (index === -1)
      return
    claims.splice(index, 1)
    sync(claims)
  }

  function update(next: string | undefined) {
    if (!next)
      return release()
    claim ??= { id: '' }
    claim.id = next
    const claims = getClaims(context, key)
    if (!claims.includes(claim))
      claims.push(claim)
    sync(claims)
  }

  // An id the rendered element has of its own (an `asChild` child's), which wins.
  let childId: string | undefined
  let last: string | undefined
  const read = () => childId || toValue(id) || undefined
  const refresh = () => {
    const next = read()
    if (next !== last)
      update(last = next)
  }
  if (typeof id === 'function' && getCurrentInstance()) {
    // A getter over the part's own props (every caller passes `() => props.id`):
    // a new prop value always re-renders the part, so re-checking before each
    // update matches a pre-flush watcher without one per part.
    refresh()
    onBeforeUpdate(refresh)
  }
  else {
    watch(() => toValue(id), refresh, { immediate: true })
  }
  // The child renders in a slot, which can change its id without updating the part, so
  // once the element has an id of its own, the attribute is watched. Only a part that
  // renders another element (`asChild`, `as="template"`, or a component as `as`), or one
  // that hydrates server HTML, whose element keeps the id the server rendered, can render
  // an id other than its own. A part that renders a tag on the client renders exactly its
  // id, and gets no hooks for it.
  let observer: MutationObserver | undefined
  let observed: Element | undefined
  if (element && rendersForeignId()) {
    const syncChild = () => {
      const el = element.value ?? undefined
      const rendered = el?.id
      childId = rendered && rendered !== (toValue(id) || generated) ? rendered : undefined
      refresh()
      if (el !== observed && (childId || observer) && typeof MutationObserver !== 'undefined') {
        observed = el
        observer ??= new MutationObserver(syncChild)
        observer.disconnect()
        if (el)
          observer.observe(el, { attributes: true, attributeFilter: ['id'] })
      }
    }
    onMounted(syncChild)
    onUpdated(syncChild)
    onScopeDispose(() => {
      observer?.disconnect()
      release()
    })
  }
  else {
    onScopeDispose(release)
  }

  return getterRef(() => toValue(id) || generated)
}
