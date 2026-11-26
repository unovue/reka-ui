// Vapor version of src/shared/useReferencedId.ts, swapped in by `vapor/plugins.mjs`. Same behaviour
// (a consumer `id` on a title, label or heading is what the referring part points at; the first
// claim wins; parts of the claiming kind keep their generated id), different mechanism.
//
// v2 turns `context[key]` into a getter on the first claim and `$forceUpdate`s everything the
// provider rendered, since parts that read it earlier read a plain string. Vapor has no component
// re-render: a template binding is a render effect that only re-runs when a ref it read changes.
// So the getter is installed when the context is provided instead (the build patches
// `createContext`'s provide to call `prepareReferencedIds`), backed by a ref that the claim writes:
// every binding that read the id, before or after the claim, depends on it and re-runs.
import type { ShallowRef } from 'vue'
import type { GenericInstance } from './internals'
import { onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { Primitive } from '../Primitive'
import { getGenericInstance, instanceElement } from './internals'

/**
 * The context keys parts claim with `claimReferencedId`. A context provided with one of them as a
 * string gets the getter up front. `vapor/tests/plugins.node.test.mjs` checks the list against src.
 */
export const REFERENCED_KEYS = ['titleId', 'descriptionId', 'headingId', 'labelId', 'textId', 'id'] as const

interface Entry {
  /** The first claim's id, which the reference points at. */
  id: ShallowRef<string | undefined>
  /** The id the context holds without a claim. */
  generated: () => string | undefined
  /** The consumer ids of the claiming parts, in the order they claimed. */
  claims?: Map<GenericInstance, string>
  /** The kinds of part that claimed it. They read the generated id from the context. */
  types?: Set<unknown>
}

const entries = new WeakMap<object, Record<string, Entry>>()

/** Whether the binding being evaluated belongs to a part of a claiming kind (or to its `Primitive`). */
function readsOwnId(types: Set<unknown> | undefined) {
  if (!types)
    return false
  let reader = getGenericInstance()
  while (reader) {
    if (types.has(reader.type))
      return true
    // A part's bindings on its `Primitive` are read by the Primitive's own effects.
    reader = reader.type === Primitive ? reader.parent ?? null : null
  }
  return false
}

function reflectEntry(context: Record<string, any>, key: string, entry: Entry, descriptor: PropertyDescriptor | undefined) {
  let value = descriptor?.value
  entry.generated = descriptor?.get ? () => descriptor.get!.call(context) : () => value
  Object.defineProperty(context, key, {
    configurable: true,
    enumerable: true,
    get() {
      const claimed = entry.id.value
      return claimed && !readsOwnId(entry.types) ? claimed : entry.generated()
    },
    set: descriptor?.set
      ? (next) => { descriptor.set!.call(context, next) }
      : (next) => { value = next },
  })
}

function newEntry(): Entry {
  return { id: shallowRef(), generated: () => undefined }
}

/**
 * Gives `context` a getter for each referenced id it holds, before any part reads it. Called by
 * the patched `provide` of `createContext`; returns `context`.
 */
export function prepareReferencedIds<T>(context: T): T {
  if (!context || typeof context !== 'object' || entries.has(context))
    return context
  let byKey: Record<string, Entry> | undefined
  for (const key of REFERENCED_KEYS) {
    const descriptor = Object.getOwnPropertyDescriptor(context, key)
    if (!descriptor || !('value' in descriptor) || typeof descriptor.value !== 'string')
      continue
    if (!byKey)
      entries.set(context, byKey = {})
    reflectEntry(context as Record<string, any>, key, byKey[key] = newEntry(), descriptor)
  }
  return context
}

function getEntry(context: Record<string, any>, key: string, reflect: boolean) {
  let byKey = entries.get(context)
  if (!byKey)
    entries.set(context, byKey = {})
  let entry = byKey[key]
  if (!entry) {
    entry = byKey[key] = newEntry()
    // Not provided through `createContext`: bindings that read it from now on follow the claim.
    if (reflect)
      reflectEntry(context, key, entry, Object.getOwnPropertyDescriptor(context, key))
  }
  return entry
}

function syncEntry(entry: Entry) {
  const first = entry.claims!.values().next().value
  if (entry.id.value !== first)
    entry.id.value = first
}

function getConsumerId(instance: GenericInstance) {
  const id = instance.attrs?.id
  return typeof id === 'string' && id ? id : undefined
}

/** With `asChild`, an `id` on the child element wins. It is the child's own when it is not the generated one. */
function getChildId(instance: GenericInstance, entry: Entry) {
  const id = instanceElement(instance)?.id
  return id && id !== entry.generated() ? id : undefined
}

function track(instance: GenericInstance, context: object, key: string, reflect: boolean, asChild: boolean, inSetup: boolean) {
  const entry = getEntry(context as Record<string, any>, key, reflect)
  const claims = entry.claims ??= new Map()
  ;(entry.types ??= new Set()).add(instance.type)
  const claim = () => {
    const id = (asChild && getChildId(instance, entry)) || getConsumerId(instance)
    if (id)
      claims.set(instance, id)
    else
      claims.delete(instance)
    syncEntry(entry)
  }
  claim()
  // Attrs are reactive in Vapor: follow the consumer `id` itself rather than the part's updates.
  if (inSetup)
    watch(() => getConsumerId(instance), claim, { flush: 'sync' })
  let observer: MutationObserver | undefined
  if (asChild && typeof MutationObserver !== 'undefined') {
    // The child renders in the slot, which can change its id without the part knowing.
    const observe = () => {
      claim()
      const element = instanceElement(instance)
      observer ??= new MutationObserver(claim)
      observer.disconnect()
      if (element)
        observer.observe(element, { attributes: true, attributeFilter: ['id'] })
    }
    if (inSetup)
      onMounted(observe)
    else
      observe()
  }
  onBeforeUnmount(() => {
    observer?.disconnect()
    claims.delete(instance)
    syncEntry(entry)
  }, instance as any)
}

/** See src/shared/useReferencedId.ts. */
export function claimReferencedId(context: object, key: string, reflect = true) {
  const instance = getGenericInstance()
  if (!instance)
    return
  const asChild = !!instance.props.asChild
  if (getConsumerId(instance)) {
    track(instance, context, key, reflect, asChild, true)
  }
  else if (asChild) {
    onMounted(() => {
      const entry = entries.get(context)?.[key]
      const id = instanceElement(instance)?.id
      if (id && id !== (entry ? entry.generated() : (context as Record<string, any>)[key]))
        track(instance, context, key, reflect, true, false)
    })
  }
}

/** The id a part claimed for `context[key]` with `claimReferencedId`, otherwise `generated`. */
export function getReferencedId<T extends string | undefined>(context: object, key: string, generated: T): string | T {
  // Created on the first read, so a computed that reads it before the claim still depends on it.
  const entry = getEntry(context as Record<string, any>, key, false)
  entry.generated = () => generated
  return entry.id.value || generated
}
