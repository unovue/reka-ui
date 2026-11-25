import type { ComponentInternalInstance, ConcreteComponent, ShallowRef, VNode } from 'vue'
import { getCurrentInstance, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, shallowRef } from 'vue'

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
    // While the boundary waits, what it renders is in the pending branch, out of the document.
    forEachRendered(vnode.suspense.activeBranch, visit)
    forEachRendered(vnode.suspense.pendingBranch, visit)
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
    // A component whose async setup has not resolved yet has no update to schedule, and
    // renders for the first time after the claim.
    if (rendered !== instance && !rendered.isUnmounted && (rendered.update as typeof rendered.update | undefined))
      rendered.proxy?.$forceUpdate()
  })
}

/**
 * With `asChild`, an `id` on the child element wins over the one the part passes down. It
 * is the child's own when it differs from that one.
 */
function getChildId(instance: ComponentInternalInstance) {
  const element = instance.subTree?.el as Element | null | undefined
  const id = element?.id
  return id && id !== instance.subTree.props?.id ? id : undefined
}

function track(instance: ComponentInternalInstance, context: object, key: string, reflect: boolean, asChild: boolean, inSetup: boolean) {
  const isFirstClaim = !entries.get(context)?.[key]
  const entry = getEntry(context, key, reflect)
  entry.types.add(instance.type)
  const claim = () => {
    const id = (asChild && getChildId(instance)) || getConsumerId(instance)
    if (id)
      entry.claims.set(instance, id)
    else
      entry.claims.delete(instance)
    syncEntry(entry)
  }
  claim()
  if (isFirstClaim && reflect)
    updateProviderTree(instance, context)
  let observer: MutationObserver | undefined
  let observed: Element | undefined
  if (asChild) {
    // The child element, and any id of its own, exists once rendered. The child renders in
    // the slot, which can change its id without updating this part, so the element is watched.
    const observe = () => {
      claim()
      const element = instance.subTree?.el as Element | null | undefined
      if (element === observed || typeof MutationObserver === 'undefined')
        return
      observed = element ?? undefined
      observer ??= new MutationObserver(claim)
      observer.disconnect()
      if (element instanceof Element)
        observer.observe(element, { attributes: true, attributeFilter: ['id'] })
    }
    if (inSetup)
      onMounted(observe, instance)
    else
      observe()
    onUpdated(observe, instance)
  }
  else {
    onBeforeUpdate(claim, instance)
  }
  onBeforeUnmount(() => {
    observer?.disconnect()
    entry.claims.delete(instance)
    syncEntry(entry)
  }, instance)
}

/**
 * Called in the setup of a part whose id another part references through `context[key]`.
 * A consumer `id` on the part, or with `asChild` on its child element, is claimed for that
 * reference, so the referring part points at it. With several such parts, the first one
 * wins; when it unmounts or drops its id, the next one does, or the reference falls back to
 * the generated id. Changes to the `id` after mount are followed, as long as the part had
 * one when it mounted.
 *
 * Without a consumer `id`, this does nothing; with `asChild`, it only looks for an id on the
 * child element once mounted.
 *
 * `reflect: false` leaves `context[key]` as it is, for a caller that reads the claim with
 * `getReferencedId` instead.
 */
export function claimReferencedId(context: object, key: string, reflect = true) {
  const instance = getCurrentInstance()
  if (!instance)
    return
  const asChild = !!instance.props.asChild
  if (getConsumerId(instance)) {
    track(instance, context, key, reflect, asChild, true)
  }
  else if (asChild) {
    onMounted(() => {
      if (getChildId(instance))
        track(instance, context, key, reflect, true, false)
    })
  }
}

/** The id a part claimed for `context[key]` with `claimReferencedId`, otherwise `generated`. */
export function getReferencedId<T extends string | undefined>(context: object, key: string, generated: T): string | T {
  return entries.get(context)?.[key]?.id.value || generated
}
