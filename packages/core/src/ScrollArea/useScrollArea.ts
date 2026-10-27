import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ScrollAreaRootContext } from './ScrollAreaRoot.vue'
import type { ScrollAreaScrollbarContext } from './ScrollAreaScrollbar.vue'
import type { ScrollAreaScrollbarVisibleContext } from './ScrollAreaScrollbarVisible.vue'
import type { Direction, ScrollType, Sizes } from './types'
import type { DisclosureState, PartSurface } from '@/shared'
import { computed, ref, toValue } from 'vue'
import { createPartSurface, disclosureState } from '@/shared'
import {
  getScrollPositionFromPointer,
  getThumbOffsetFromScroll,
  getThumbRatio,
  getThumbSize,
  isScrollingWithinScrollbarBounds,
} from './utils'

export interface UseScrollAreaProps {
  /** Scrollbar visibility: `'hover'` (default), `'auto'`, `'always'`, `'scroll'` or `'glimpse'`. */
  type?: MaybeRefOrGetter<ScrollType | undefined>
  /** Reading direction; defaults to `'ltr'`. The component resolves `ConfigProvider` first. */
  dir?: MaybeRefOrGetter<Direction | undefined>
  /** Delay before `scroll`/`hover`/`glimpse` scrollbars hide, in ms. Defaults to `600`. */
  scrollHideDelay?: MaybeRefOrGetter<number | undefined>
  /** The root element; the component passes its forwarded element. */
  scrollArea?: Ref<HTMLElement | undefined | null>
}

export interface UseScrollAreaReturn {
  /** The registered viewport element. */
  viewportElement: Ref<HTMLElement | undefined>
  /** Scroll the viewport to the top. */
  scrollTop: () => void
  /** Scroll the viewport to the top-left. */
  scrollTopLeft: () => void
  root: PartSurface
  /** The scrolling element; native scrollbars are hidden by the component's injected style. */
  viewport: PartSurface
  /** The element wrapping the content inside the viewport. */
  content: PartSurface
  context: ScrollAreaRootContext
}

/**
 * Headless ScrollArea root: element registry, corner size CSS variables and
 * the root/viewport/content surfaces. The scrollbar parts keep their
 * ResizeObserver, pointer-capture and visibility timers, so a standalone
 * consumer gets the layout but not the custom scrollbars.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useScrollArea(props: UseScrollAreaProps = {}): UseScrollAreaReturn {
  const cornerWidth = ref(0)
  const cornerHeight = ref(0)
  const viewport = ref<HTMLElement>()
  const content = ref<HTMLElement>()
  const scrollbarX = ref<HTMLElement>()
  const scrollbarY = ref<HTMLElement>()
  const scrollbarXEnabled = ref(false)
  const scrollbarYEnabled = ref(false)

  const type = computed(() => toValue(props.type) ?? 'hover')
  const dir = computed(() => toValue(props.dir) ?? 'ltr')
  const scrollHideDelay = computed(() => toValue(props.scrollHideDelay) ?? 600)

  function scrollTop() {
    viewport.value?.scrollTo({ top: 0 })
  }
  function scrollTopLeft() {
    viewport.value?.scrollTo({ top: 0, left: 0 })
  }

  const context: ScrollAreaRootContext = {
    type: type as Ref<ScrollType>,
    dir: dir as Ref<Direction>,
    scrollHideDelay: scrollHideDelay as Ref<number>,
    scrollArea: (props.scrollArea ?? ref<HTMLElement>()) as Ref<HTMLElement | undefined>,
    viewport,
    onViewportChange: (el) => {
      viewport.value = el || undefined
    },
    content,
    onContentChange: (el) => {
      content.value = el
    },
    scrollbarX,
    scrollbarXEnabled,
    scrollbarY,
    scrollbarYEnabled,
    onScrollbarXChange: (scrollbar) => {
      scrollbarX.value = scrollbar || undefined
    },
    onScrollbarYChange: (scrollbar) => {
      scrollbarY.value = scrollbar || undefined
    },
    onScrollbarXEnabledChange: (rendered) => {
      scrollbarXEnabled.value = rendered
    },
    onScrollbarYEnabledChange: (rendered) => {
      scrollbarYEnabled.value = rendered
    },
    onCornerWidthChange: (width) => {
      cornerWidth.value = width
    },
    onCornerHeightChange: (height) => {
      cornerHeight.value = height
    },
  }

  return {
    viewportElement: viewport,
    scrollTop,
    scrollTopLeft,
    root: createPartSurface(() => ({
      dir: dir.value,
      style: {
        'position': 'relative',
        // Pass corner sizes as CSS vars to reduce re-renders of context consumers
        '--reka-scroll-area-corner-width': `${cornerWidth.value}px`,
        '--reka-scroll-area-corner-height': `${cornerHeight.value}px`,
      },
    }), () => ({})),
    viewport: getScrollAreaViewportSurface(context),
    content: getScrollAreaContentSurface(context),
    context,
  }
}

/**
 * Viewport surface, shared by `useScrollArea()` and `ScrollAreaViewport.vue`.
 *
 * @internal
 */
export function getScrollAreaViewportSurface(context: ScrollAreaRootContext): PartSurface {
  return createPartSurface(() => ({
    // Functional selector: the injected style hides native scrollbars through it.
    'data-reka-scroll-area-viewport': '',
    'style': {
      // `scroll`, not `auto`: the native scrollbar is hidden with CSS anyway, and
      // the element must stay scrollable whenever a custom scrollbar is enabled.
      overflowX: context.scrollbarXEnabled.value ? 'scroll' : 'hidden',
      overflowY: context.scrollbarYEnabled.value ? 'scroll' : 'hidden',
    },
    'tabindex': 0,
  }), () => ({}))
}

/**
 * Content surface, shared by `useScrollArea()` and `ScrollAreaViewport.vue`.
 *
 * @internal
 */
export function getScrollAreaContentSurface(context: ScrollAreaRootContext): PartSurface {
  return createPartSurface(() => ({
    style: {
      // With a horizontal scrollbar the content must be at least as wide as its
      // children for size calculations; without one the parent constrains it so
      // `text-overflow: ellipsis` works.
      minWidth: context.scrollbarXEnabled.value ? 'fit-content' : undefined,
    },
  }), () => ({}))
}

/**
 * The visible scrollbar's state: sizes, thumb ratio, wheel/drag
 * scrolling and thumb positioning (RTL-aware). Built once per
 * `ScrollAreaScrollbarVisible` instance.
 *
 * @internal
 */
export function createScrollAreaScrollbarVisibleContext(
  rootContext: ScrollAreaRootContext,
  scrollbarContext: Pick<ScrollAreaScrollbarContext, 'isHorizontal'>,
): ScrollAreaScrollbarVisibleContext {
  const sizes = ref<Sizes>({
    content: 0,
    viewport: 0,
    scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 },
  })

  const hasThumb = computed(() => {
    const thumbRatio = getThumbRatio(sizes.value.viewport, sizes.value.content)
    return Boolean(thumbRatio > 0 && thumbRatio < 1)
  })

  const thumbRef = ref<HTMLElement>()
  const pointerOffset = ref(0)
  const isHorizontal = () => scrollbarContext.isHorizontal.value

  function handleWheelScroll(event: WheelEvent, payload: number) {
    const viewport = rootContext.viewport.value!
    const axis = isHorizontal() ? 'scrollLeft' : 'scrollTop'
    const scrollPos = viewport[axis] + event.deltaY
    viewport[axis] = scrollPos
    // prevent window scroll when wheeling on scrollbar
    if (isScrollingWithinScrollbarBounds(scrollPos, payload))
      event.preventDefault()
  }

  function onDragScroll(payload: number) {
    if (isHorizontal())
      rootContext.viewport.value!.scrollLeft = getScrollPositionFromPointer(payload, pointerOffset.value, sizes.value, rootContext.dir.value)
    else
      rootContext.viewport.value!.scrollTop = getScrollPositionFromPointer(payload, pointerOffset.value, sizes.value)
  }

  function onThumbPositionChange() {
    const viewport = rootContext.viewport.value
    if (!viewport || !thumbRef.value)
      return
    if (isHorizontal()) {
      const offset = getThumbOffsetFromScroll(viewport.scrollLeft, sizes.value, rootContext.dir.value)
      thumbRef.value.style.transform = `translate3d(${offset}px, 0, 0)`
    }
    else {
      const offset = getThumbOffsetFromScroll(viewport.scrollTop, sizes.value)
      thumbRef.value.style.transform = `translate3d(0, ${offset}px, 0)`
    }
  }

  return {
    sizes,
    hasThumb,
    handleWheelScroll,
    handleThumbDown: (_event, payload) => {
      pointerOffset.value = isHorizontal() ? payload.x : payload.y
    },
    handleThumbUp: () => {
      pointerOffset.value = 0
    },
    handleSizeChange: (payload) => {
      sizes.value = payload
    },
    onThumbPositionChange,
    onThumbChange: (element) => {
      thumbRef.value = element
    },
    onDragScroll,
  }
}

/**
 * Thumb size CSS variable for a scrollbar axis.
 *
 * @internal
 */
export function getScrollAreaThumbSizeVar(context: Pick<ScrollAreaScrollbarVisibleContext, 'sizes'>, horizontal: boolean) {
  const sizes = context.sizes.value
  return { [`--reka-scroll-area-thumb-${horizontal ? 'width' : 'height'}`]: sizes ? `${getThumbSize(sizes)}px` : undefined }
}

export type ScrollAreaThumbState = { state: DisclosureState }

/**
 * Thumb surface: `data-state` from whether the content overflows,
 * the size variables, and the pointer offset handlers used while dragging.
 *
 * @internal
 */
export function getScrollAreaThumbSurface(context: ScrollAreaScrollbarVisibleContext): PartSurface<ScrollAreaThumbState> {
  return createPartSurface<ScrollAreaThumbState>(
    () => ({
      style: {
        width: 'var(--reka-scroll-area-thumb-width)',
        height: 'var(--reka-scroll-area-thumb-height)',
      },
      onPointerdown: (event: PointerEvent) => {
        const thumbRect = (event.target as HTMLElement).getBoundingClientRect()
        context.handleThumbDown(event, { x: event.clientX - thumbRect.left, y: event.clientY - thumbRect.top })
      },
      onPointerup: (event: PointerEvent) => context.handleThumbUp(event),
    }),
    () => ({ state: disclosureState(context.hasThumb.value) }),
  )
}
