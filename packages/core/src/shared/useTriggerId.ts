import type { ComputedRef, Ref } from 'vue'
import { getCurrentInstance, onActivated, onBeforeMount, onBeforeUnmount, onBeforeUpdate, onDeactivated, onMounted, onUpdated, ref, shallowRef, toRaw, useAttrs, watch } from 'vue'
import { rendersForeignId } from './usePartId'

// How many content elements are rendered for a context. Kept beside the context rather
// than on it, so the context types stay as they are.
const mountedContents = new WeakMap<object, Ref<number>>()

function useMountedContents(context: object) {
  let count = mountedContents.get(context)
  if (!count) {
    count = ref(0)
    mountedContents.set(context, count)
  }
  return count
}

// One symbol and one accessor pair per id name, shared by every context: an accessor added
// as a new property keeps the object's fast properties, and contexts built alike share one
// hidden class. A per-context closure as accessor, an accessor in the object literal, or
// turning an existing data property into an accessor all switch the whole context to slow
// (dictionary) properties, which costs a few hundred bytes per context.
const idProperties = new Map<string, { key: symbol, descriptor: PropertyDescriptor }>()

function idProperty(name: string) {
  let property = idProperties.get(name)
  if (!property) {
    const key = Symbol(name)
    property = {
      key,
      descriptor: {
        enumerable: true,
        configurable: true,
        // `toRaw`: read through a reactive proxy of the context, `this[key]` would be unwrapped.
        // The slot holds the plain id until the first read, which puts a ref in its place:
        // an id nothing reads (a closed popup's content id) costs no ref.
        get(this: object) {
          const raw = toRaw(this) as Record<symbol, string | Ref<string>>
          let slot = raw[key]!
          if (typeof slot === 'string')
            slot = raw[key] = shallowRef(slot)
          return slot.value
        },
        set(this: object, value: string) {
          const raw = toRaw(this) as Record<symbol, string | Ref<string>>
          const slot = raw[key]!
          if (typeof slot === 'string')
            raw[key] = value
          else
            slot.value = value
        },
      },
    }
    idProperties.set(name, property)
  }
  return property
}

/**
 * Adds the given string properties to a context object, backed by refs (created on the first
 * read), so the context keeps its plain `string` types while templates that read those
 * properties re-render when they change. The properties must not be in `context` yet: pass the context
 * without them and their initial values in `ids`.
 */
export function defineReactiveIds<T extends object, K extends keyof T & string>(context: Omit<T, K>, ids: Pick<T, K>): T {
  for (const name in ids) {
    const { key, descriptor } = idProperty(name)
    ;(context as Record<symbol, unknown>)[key] = ids[name]
    Object.defineProperty(context, name, descriptor)
  }
  return context as T
}

/**
 * Resolves the id a trigger renders and stores it on `context.triggerId`, which the
 * related content reads for `aria-labelledby`.
 *
 * - An `id` the consumer passes to the trigger wins.
 * - Otherwise the id already on the context is kept, or `generate` fills it.
 * - Once mounted, and after every update, the id the element really rendered wins:
 *   with `asChild`, an `id` on the child element overrides the one passed down, and a
 *   consumer `id` that changes after mount is picked up.
 *
 * `rendered: false` skips that last check, for a trigger that renders `context.triggerId`
 * itself on its own element; by default it only runs for a part that may render another id
 * (see `rendersForeignId`).
 */
export function useTriggerId(
  context: { triggerId: string },
  element: Readonly<Ref<HTMLElement | undefined>>,
  generate?: () => string,
  rendered: boolean = rendersForeignId(),
) {
  const attrs = useAttrs()
  let consumerId = attrs.id
  if (typeof consumerId === 'string' && consumerId)
    context.triggerId = consumerId
  else if (!context.triggerId && generate)
    context.triggerId = generate()

  onBeforeUpdate(() => {
    if (attrs.id === consumerId)
      return
    consumerId = attrs.id
    if (typeof consumerId === 'string' && consumerId)
      context.triggerId = consumerId
  })
  if (!rendered)
    return
  const syncRendered = () => {
    const renderedId = element.value?.id
    if (renderedId && renderedId !== context.triggerId)
      context.triggerId = renderedId
  }
  onMounted(syncRendered)
  onUpdated(syncRendered)
}

/**
 * The content-side counterpart of `useTriggerId`: resolves the id a content renders and
 * stores it on `context.contentId`, which the related trigger reads for `aria-controls`.
 * An element hydrated from server HTML keeps the id of the server render, which wins
 * here over an id the client generated differently.
 */
export function useContentId(
  context: { contentId: string },
  element: Readonly<Ref<HTMLElement | undefined>>,
) {
  useTriggerId({
    get triggerId() {
      return context.contentId
    },
    set triggerId(id) {
      context.contentId = id
    },
  }, element, undefined, true)
  useContentElement(context, element)
}

/**
 * Keeps `context.contentId` on the id `element` rendered, for an element that comes and
 * goes while the caller stays mounted. Part of `useContentId`; called on its own when
 * the element that carries the id is not the one the caller's own `id` attribute lands on.
 */
export function useContentElement(
  context: { contentId: string },
  element: Readonly<Ref<HTMLElement | undefined>>,
) {
  watch(element, (el) => {
    if (el?.id && el.id !== context.contentId)
      context.contentId = el.id
  }, { flush: 'post' })
}

/**
 * Records that the calling content has rendered `element`, which `useRenderedContentId`
 * reads on the trigger side. `key` is an object both sides share: the context that holds
 * `contentId`, unless the trigger passes another one.
 *
 * A mounted content counts while its element is rendered. It stops counting while it
 * renders none (an `asChild` content whose slot is empty) and while `KeepAlive` holds it
 * deactivated, unless its element stayed in the document, as teleported content does.
 *
 * The count first changes right before the caller mounts and unmounts, not in
 * `onMounted`: the trigger then updates in the same pass that adds or removes the
 * content. A write from a mounted hook would re-render the trigger in a second pass,
 * which reorders whatever else waits on `nextTick` around an opening content, such as
 * moving focus into it. The later checks only write when the content turns out to have
 * no element, or gains or loses it while mounted.
 */
export function useContentMounted(key: object, element: Readonly<Ref<HTMLElement | undefined>>) {
  const count = useMountedContents(key)
  const instance = getCurrentInstance()!
  let isCounted = false
  const setCounted = (value: boolean) => {
    if (value === isCounted)
      return
    isCounted = value
    count.value += value ? 1 : -1
  }

  // Whether `KeepAlive` holds the caller deactivated. A deactivated element is kept in a
  // detached container, where it still has a parent, so it only counts while it is in
  // the document: teleported content stays there, and so does content that a transition
  // around the `KeepAlive` is still leaving.
  let isDeactivated = false
  const isRendered = () => {
    const el = element.value
    return !!el && (isDeactivated ? el.isConnected : !!el.parentNode)
  }

  // An `asChild` content takes its element from a slot, which adds and removes the
  // element without updating the caller, so `element` is not told. The node the element
  // is a child of is watched instead. Once the element is gone from it, the caller
  // renders again on every change there, which is what makes `element` resolve anew.
  // A deactivated element leaves the document with whichever ancestor `KeepAlive` stores
  // away, so the whole document is watched for as long as such an element stays in it.
  let observer: MutationObserver | undefined
  let parent: Node | null | undefined
  const observe = () => {
    observer ??= new MutationObserver(() => {
      if (!isRendered()) {
        setCounted(false)
        if (isDeactivated)
          observer!.disconnect()
        else
          instance.proxy?.$forceUpdate()
      }
      // Moved, as a teleported content is when its target changes.
      else if (!isDeactivated && element.value!.parentNode !== parent) {
        observe()
      }
    })
    observer.disconnect()
    if (isDeactivated) {
      if (isCounted)
        observer.observe(element.value!.getRootNode(), { childList: true, subtree: true })
      return
    }
    parent = element.value?.parentNode
    // Without an element, it would be added in place of the node the caller rendered, or inside it.
    const root = instance.vnode.el as Node | null
    for (const node of parent ? [parent] : [root, root?.parentNode]) {
      if (node)
        observer.observe(node, { childList: true })
    }
  }
  const syncElement = () => {
    setCounted(isRendered())
    observe()
  }

  onBeforeMount(() => {
    // A content can mount while an ancestor is deactivated, which no hook reports.
    for (let parent = instance.parent; parent && !isDeactivated; parent = parent.parent)
      isDeactivated = !!(parent as { isDeactivated?: boolean }).isDeactivated
    setCounted(!isDeactivated)
  })
  onMounted(syncElement)
  watch(element, syncElement, { flush: 'post' })
  onActivated(() => {
    isDeactivated = false
    syncElement()
  })
  onDeactivated(() => {
    isDeactivated = true
    syncElement()
  })
  onBeforeUnmount(() => {
    observer?.disconnect()
    setCounted(false)
  })
}

/**
 * The id a trigger may reference (`aria-controls`, `aria-describedby`): the id the
 * content rendered, while a content has its element rendered. `undefined` otherwise, which
 * includes the server render and the first render of a hydrating trigger, so that the
 * reference is patched onto the trigger once the content exists instead of being left
 * as the server wrote it. Needs `useContentMounted` on the content side.
 */
export function useRenderedContentId(context: { contentId: string }, key: object = context): ComputedRef<string | undefined> {
  return new RenderedContentIdRef(context, key) as unknown as ComputedRef<string | undefined>
}

/**
 * The ref `useRenderedContentId` returns: a getter, without a computed or a closure. The
 * count is looked up (and created) on the first read, so a trigger that reads it only
 * while open (a tooltip) allocates nothing until then.
 */
class RenderedContentIdRef {
  // Ref markers as prototype getters: no per-instance slots.
  get __v_isRef(): true { return true }
  get __v_isReadonly(): true { return true }
  constructor(readonly context: { contentId: string }, readonly key: object) {}
  get value(): string | undefined {
    return (useMountedContents(this.key).value > 0 && this.context.contentId) || undefined
  }
}
