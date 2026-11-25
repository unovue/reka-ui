import type { ComponentInternalInstance, ConcreteComponent, ShallowRef, VNode } from 'vue'
import { getCurrentInstance, onBeforeUnmount, onBeforeUpdate, shallowRef } from 'vue'

// A part whose id another part references (a title, a label, a heading) renders the id a
// context holds for it, and the referring part reads the same context value. A consumer
// `id` on the part lands on its element instead, so the reference has to follow it.
//
// Nothing here runs or allocates until a part has a consumer `id`. Only then is an entry
// kept, beside the context, and the context value turned into a getter: the referring part
// reads the claimed id from it, while parts of the claiming kind keep reading their own
// generated id, so two titles never render the same id.

interface Entry {
  /** The consumer ids of the parts that claim the reference, in the order they claimed it. */
  claims: Map<ComponentInternalInstance, string>
  /** The kinds of part that claimed it. They read the generated id from the context. */
  types: Set<ConcreteComponent>
  /** The first claim's id, which the reference points at. */
  id: ShallowRef<string | undefined>
}

const entries = new WeakMap<object, Record<string, Entry>>()

function getEntry(context: Record<string, any>, key: string, reflect: boolean) {
  let byKey = entries.get(context)
  if (!byKey)
    entries.set(context, byKey = {})
  let entry = byKey[key]
  if (entry)
    return entry
  entry = byKey[key] = { claims: new Map(), types: new Set(), id: shallowRef() }
  if (reflect) {
    const descriptor = Object.getOwnPropertyDescriptor(context, key)
    let value = descriptor?.value
    const readGenerated = descriptor?.get ? () => descriptor.get!.call(context) : () => value
    const { types, id } = entry
    Object.defineProperty(context, key, {
      configurable: true,
      enumerable: true,
      get() {
        const reader = getCurrentInstance()
        const generated = readGenerated()
        return reader && types.has(reader.type) ? generated : (id.value || generated)
      },
      set: descriptor?.set
        ? (next) => { descriptor.set!.call(context, next) }
        : (next) => { value = next },
    })
  }
  return entry
}

function syncEntry(entry: Entry) {
  const first = entry.claims.values().next().value
  if (entry.id.value !== first)
    entry.id.value = first
}

function getConsumerId(instance: ComponentInternalInstance) {
  const id = instance.attrs.id
  return typeof id === 'string' && id ? id : undefined
}

function getProvides(instance: ComponentInternalInstance) {
  return (instance as unknown as { provides: Record<symbol, unknown> }).provides
}

function findProvider(instance: ComponentInternalInstance, context: object) {
  for (let parent = instance.parent; parent; parent = parent.parent) {
    // `provides` is internal. An instance that provides nothing shares its parent's object;
    // one that provides gets its own, whose own symbols are what it provided.
    const provides = getProvides(parent)
    if (parent.parent && provides === getProvides(parent.parent))
      continue
    if (Object.getOwnPropertySymbols(provides).some(symbol => provides[symbol] === context))
      return parent
  }
}

function forEachRendered(vnode: VNode | null | undefined, visit: (instance: ComponentInternalInstance) => void) {
  if (!vnode)
    return
  if (vnode.component) {
    visit(vnode.component)
    forEachRendered(vnode.component.subTree, visit)
  }
  else if (vnode.suspense) {
    forEachRendered(vnode.suspense.activeBranch, visit)
  }
  else if (Array.isArray(vnode.children)) {
    for (const child of vnode.children)
      forEachRendered(child as VNode, visit)
  }
}

/**
 * Re-renders what the context's provider has rendered so far. Any of it may have read
 * `context[key]` before it became a getter, wherever it sits relative to the claiming
 * part, and only reads through the getter follow the claim. Runs once per context and key,
 * on the first claim; parts rendered later read the getter anyway.
 */
function updateProviderTree(instance: ComponentInternalInstance, context: object) {
  const provider = findProvider(instance, context)
  // A server render has no updates to schedule: hydration renders the client anew.
  if (!provider || !(provider.update as typeof provider.update | undefined))
    return
  provider.proxy?.$forceUpdate()
  forEachRendered(provider.subTree, (rendered) => {
    if (rendered !== instance)
      rendered.proxy?.$forceUpdate()
  })
}

/**
 * Called in the setup of a part whose id another part references through `context[key]`.
 * A consumer `id` on the part is claimed for that reference, so the referring part points
 * at it. With several such parts, the first one wins; when it unmounts or drops its id,
 * the next one does, or the reference falls back to the generated id. Changes to the `id`
 * after mount are followed, as long as the part had one when it was set up.
 *
 * Without a consumer `id`, this does nothing.
 *
 * `reflect: false` leaves `context[key]` as it is, for a caller that reads the claim with
 * `getReferencedId` instead.
 */
export function claimReferencedId(context: object, key: string, reflect = true) {
  const instance = getCurrentInstance()
  if (!instance || !getConsumerId(instance))
    return

  const isFirstClaim = !entries.get(context)?.[key]
  const entry = getEntry(context, key, reflect)
  entry.types.add(instance.type)
  const claim = () => {
    const id = getConsumerId(instance)
    if (id)
      entry.claims.set(instance, id)
    else
      entry.claims.delete(instance)
    syncEntry(entry)
  }
  claim()
  if (isFirstClaim && reflect)
    updateProviderTree(instance, context)
  onBeforeUpdate(claim)
  onBeforeUnmount(() => {
    entry.claims.delete(instance)
    syncEntry(entry)
  })
}

/** The id a part claimed for `context[key]` with `claimReferencedId`, otherwise `generated`. */
export function getReferencedId<T extends string | undefined>(context: object, key: string, generated: T): string | T {
  return entries.get(context)?.[key]?.id.value || generated
}
