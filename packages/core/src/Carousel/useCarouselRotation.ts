import type { Ref } from 'vue'
import type { CarouselRootContext } from './CarouselRoot.vue'
import { useEventListener, useMediaQuery } from '@vueuse/core'
import { computed, onMounted, onScopeDispose, ref, watch } from 'vue'
import { containsComposed, getOwnerDocument } from '@/shared'
import { useIsUsingKeyboard } from '@/shared/useIsUsingKeyboard'

/**
 * Root-level rotation behaviour shared by `autoplay` and `autoScroll`
 * (APG Carousel): rotation pauses while a mouse hovers the carousel or the
 * page is hidden, stops when keyboard focus enters it, and stops on mount
 * when the user prefers reduced motion. Also runs the `autoplay` timer; the
 * continuous `autoScroll` needs the track and runs in the viewport.
 *
 * Returns the listeners to bind on the root element.
 *
 * @lifecycle setup
 */
export function useCarouselRotation(context: CarouselRootContext, rootElement: Ref<HTMLElement | null | undefined>) {
  const hovered = ref(false)
  const pageHidden = ref(false)
  const isUsingKeyboard = useIsUsingKeyboard()
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  watch(reducedMotion, value => context.reducedMotion.value = value, { immediate: true })
  watch([hovered, pageHidden], ([h, p]) => context.paused.value = h || p, { immediate: true })

  function stopForReducedMotion() {
    if (context.reducedMotion.value && context.rotationEnabled.value && context.playing.value)
      context.setPlaying(false, 'reduced-motion')
  }

  onMounted(() => {
    // Children register first; from here on item indices come from the DOM.
    context.mounted.value = true
    stopForReducedMotion()
    const doc = getOwnerDocument(rootElement.value)
    // A carousel mounted in a background tab starts paused.
    pageHidden.value = doc.visibilityState === 'hidden'
    useEventListener(doc, 'visibilitychange', () => {
      pageHidden.value = doc.visibilityState === 'hidden'
    })
  })
  watch(reducedMotion, stopForReducedMotion)

  const autoplayRunning = computed(() => !!context.autoplay.value
    && context.playing.value
    && context.mounted.value
    && !context.paused.value
    && !context.dragging.value)

  let timer: ReturnType<typeof setTimeout> | undefined
  function clear() {
    if (timer !== undefined)
      clearTimeout(timer)
    timer = undefined
  }
  function advance() {
    timer = undefined
    const options = context.autoplay.value
    if (!options)
      return
    const last = context.modelValue.value >= context.snapCount.value - 1
    if (last && !context.loopActive.value) {
      if (options.stopOnLastSnap) {
        context.setPlaying(false, 'last-snap')
        return
      }
      context.changeModelValue(0, 'autoplay')
    }
    else {
      context.scrollNext('autoplay')
    }
    // A cancelled step, or a controlled parent that ignored it, leaves `modelValue`
    // as it was and the watcher below never restarts the timer. A step that did
    // move restarts it there anyway.
    const delay = context.autoplay.value?.delay
    if (timer === undefined && autoplayRunning.value && delay !== undefined)
      timer = setTimeout(advance, delay)
  }
  // Every change of the current snap restarts the interval, whatever caused it.
  watch(
    [autoplayRunning, context.modelValue, () => context.autoplay.value?.delay],
    ([running, , delay]) => {
      clear()
      if (running && delay !== undefined)
        timer = setTimeout(advance, delay)
    },
    { immediate: true },
  )
  onScopeDispose(clear)

  const attrs = {
    onPointerenter(event: PointerEvent) {
      if (event.pointerType === 'mouse')
        hovered.value = true
    },
    onPointerleave(event: PointerEvent) {
      if (event.pointerType === 'mouse')
        hovered.value = false
    },
    onFocusin(event: FocusEvent) {
      if (!context.rotationEnabled.value || !context.playing.value || !isUsingKeyboard.value)
        return
      const from = event.relatedTarget as Node | null
      if (from && rootElement.value && containsComposed(rootElement.value, from))
        return
      // APG: keyboard focus inside the carousel stops rotation until the rotation control restarts it.
      context.setPlaying(false, 'focus', event)
    },
  }

  return { attrs }
}
