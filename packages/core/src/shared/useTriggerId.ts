import type { Ref } from 'vue'
import { onMounted, ref, useAttrs } from 'vue'

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
 * - Once mounted, the id the element really rendered wins: with `asChild`, an `id`
 *   on the child element overrides the one passed down.
 *
 * The consumer id is read once, during setup.
 */
export function useTriggerId(
  context: { triggerId: string },
  element: Readonly<Ref<HTMLElement | undefined>>,
  generate?: () => string,
) {
  const consumerId = useAttrs().id
  if (typeof consumerId === 'string' && consumerId)
    context.triggerId = consumerId
  else if (!context.triggerId && generate)
    context.triggerId = generate()

  onMounted(() => {
    const renderedId = element.value?.id
    if (renderedId && renderedId !== context.triggerId)
      context.triggerId = renderedId
  })
}
