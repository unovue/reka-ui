import type { Ref } from 'vue'
import { computed, onBeforeMount, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, useAttrs, watch } from 'vue'

// How many content elements are mounted for a context. Kept beside the context rather
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

/**
 * Backs the given string properties of a context object with refs, so the context
 * keeps its plain `string` types while templates that read those properties
 * re-render when they change.
 */
export function defineReactiveIds<T extends object, K extends keyof T>(context: T, keys: K[]) {
  for (const key of keys) {
    const id = ref(context[key])
    Object.defineProperty(context, key, {
      enumerable: true,
      get: () => id.value,
      set: (value) => { id.value = value },
    })
  }
  return context
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
 */
export function useTriggerId(
  context: { triggerId: string },
  element: Readonly<Ref<HTMLElement | undefined>>,
  generate?: () => string,
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
  }, element)
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
 * Records that a content element is mounted for as long as the calling component is,
 * which `useRenderedContentId` reads on the trigger side. `key` is an object both sides
 * share: the context that holds `contentId`, unless the trigger passes another one.
 *
 * The count changes right before the caller mounts and unmounts, not in `onMounted`: the
 * trigger then updates in the same pass that adds or removes the content. A write from a
 * mounted hook would re-render the trigger in a second pass, which reorders whatever
 * else waits on `nextTick` around an opening content, such as moving focus into it.
 */
export function useContentMounted(key: object) {
  const count = useMountedContents(key)
  let isCounted = false
  onBeforeMount(() => {
    isCounted = true
    count.value++
  })
  onBeforeUnmount(() => {
    if (isCounted)
      count.value--
  })
}

/**
 * The id a trigger may reference (`aria-controls`, `aria-describedby`): the id the
 * content rendered, while a content element is mounted. `undefined` otherwise, which
 * includes the server render and the first render of a hydrating trigger, so that the
 * reference is patched onto the trigger once the content exists instead of being left
 * as the server wrote it. Needs `useContentMounted` on the content side.
 */
export function useRenderedContentId(context: { contentId: string }, key: object = context) {
  const count = useMountedContents(key)
  return computed(() => (count.value > 0 && context.contentId) || undefined)
}
