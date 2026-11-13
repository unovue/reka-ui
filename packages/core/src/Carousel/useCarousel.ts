import type { MaybeRefOrGetter, Ref } from 'vue'
import type { CarouselRootContext, CarouselRootEmits, CarouselRootProps } from './CarouselRoot.vue'
import type { CarouselSurface } from './surface'
import type { CarouselItemSnapStyle, CarouselSnap } from './utils'
import type { DataOrientation, Direction } from '@/shared/types'
import { useVModel } from '@vueuse/core'
import { computed, ref, shallowRef, toValue } from 'vue'
import { chunk } from '@/shared'
import { compareDocumentOrder } from './dom'
import { createSurface } from './surface'
import { compactStyle, getFixedGroupSize, getSnapsByPosition, stepIndex } from './utils'

export interface CarouselAutoplayOptions {
  /** Time between two slides, in milliseconds. @defaultValue 4000 */
  delay?: number
  /** Stop for good on the first press, drag, key or wheel gesture. @defaultValue true */
  stopOnInteraction?: boolean
  /** Stop on the last snap instead of rewinding to the first one. Ignored with `loop`. @defaultValue false */
  stopOnLastSnap?: boolean
}

export interface CarouselAutoScrollOptions {
  /** Scroll speed, in pixels per second. @defaultValue 60 */
  speed?: number
  /** @defaultValue 'forward' */
  direction?: 'forward' | 'backward'
  /** Stop for good on the first press, drag, key or wheel gesture. @defaultValue true */
  stopOnInteraction?: boolean
}

type CarouselContentState = { orientation: DataOrientation }
type CarouselItemState = { index: number | undefined, active: boolean, inView: boolean | undefined, orientation: DataOrientation }
type CarouselNavigationState = { disabled: boolean, orientation: DataOrientation }
type CarouselIndicatorState = { active: boolean, orientation: DataOrientation }
type CarouselAutoplayToggleState = { state: 'playing' | 'paused', disabled: boolean }

function resolveAutoplay(value: boolean | CarouselAutoplayOptions | undefined): Required<CarouselAutoplayOptions> | undefined {
  if (!value)
    return undefined
  const options = value === true ? {} : value
  return {
    delay: options.delay ?? 4000,
    stopOnInteraction: options.stopOnInteraction ?? true,
    stopOnLastSnap: options.stopOnLastSnap ?? false,
  }
}

function resolveAutoScroll(value: boolean | CarouselAutoScrollOptions | undefined): Required<CarouselAutoScrollOptions> | undefined {
  if (!value)
    return undefined
  const options = value === true ? {} : value
  return {
    speed: options.speed ?? 60,
    direction: options.direction ?? 'forward',
    stopOnInteraction: options.stopOnInteraction ?? true,
  }
}

/**
 * The snap one step from the current one. A looping track steps through the
 * snaps in their visual order, which a rotation keeps equal to index order
 * around the current snap; a non-looping one steps by index.
 */
function getStepTarget(index: number, snaps: CarouselSnap[], measured: boolean, loop: boolean, step: 1 | -1): number | undefined {
  const count = snaps.length
  if (!loop || !measured)
    return stepIndex(index, step, count, loop)
  const order = getSnapsByPosition(snaps)
  const next = order[order.indexOf(index) + step]
  return next ?? stepIndex(index, step, count, true)
}

export function getCarouselNavigationSurface(context: CarouselRootContext, kind: 'previous' | 'next'): CarouselSurface<CarouselNavigationState> {
  const disabled = () => kind === 'previous' ? !context.canScrollPrev.value : !context.canScrollNext.value
  return createSurface<CarouselNavigationState>(
    () => ({
      'aria-label': kind === 'previous' ? 'Previous slide' : 'Next slide',
      'aria-controls': context.contentId,
      'disabled': disabled(),
      'onClick': (event: MouseEvent) => {
        if (event.defaultPrevented || disabled())
          return
        context.reportInteraction()
        if (kind === 'previous')
          context.scrollPrev()
        else
          context.scrollNext()
      },
    }),
    () => ({ disabled: disabled(), orientation: context.orientation.value }),
  )
}

export function getCarouselIndicatorSurface(context: CarouselRootContext, index: MaybeRefOrGetter<number>): CarouselSurface<CarouselIndicatorState> {
  const isActive = () => context.modelValue.value === toValue(index)
  return createSurface<CarouselIndicatorState>(
    () => ({
      'aria-label': `Go to slide ${toValue(index) + 1}`,
      'aria-controls': context.contentId,
      // APG grouped carousel: the current picker stays focusable but is marked unavailable.
      'aria-disabled': isActive() ? 'true' : undefined,
      'onClick': (event: MouseEvent) => {
        if (event.defaultPrevented || isActive())
          return
        context.reportInteraction()
        context.changeModelValue(toValue(index))
      },
    }),
    () => ({ active: isActive(), orientation: context.orientation.value }),
  )
}

export function getCarouselAutoplayToggleSurface(context: CarouselRootContext): CarouselSurface<CarouselAutoplayToggleState> {
  const playing = () => context.rotationEnabled.value && context.playing.value
  return createSurface<CarouselAutoplayToggleState>(
    () => ({
      'aria-label': playing() ? 'Stop slide rotation' : 'Start slide rotation',
      'aria-controls': context.contentId,
      'disabled': !context.rotationEnabled.value,
      'onClick': (event: MouseEvent) => {
        if (event.defaultPrevented || !context.rotationEnabled.value)
          return
        context.setPlaying(!context.playing.value)
      },
    }),
    () => ({ state: playing() ? 'playing' : 'paused', disabled: !context.rotationEnabled.value }),
  )
}

export function getCarouselContentSurface(context: CarouselRootContext): CarouselSurface<CarouselContentState> {
  return createSurface<CarouselContentState>(
    () => {
      const vertical = context.orientation.value === 'vertical'
      const fade = context.options.value.fade
      const spacing = context.spacing.value
      return {
        'id': context.contentId,
        // APG: announce slide changes politely, but not while rotating on its own.
        'aria-live': context.rotationEnabled.value && context.playing.value ? 'off' : 'polite',
        'aria-atomic': 'false',
        'style': compactStyle(fade
          ? { display: 'grid', alignItems: context.options.value.autoHeight && !vertical ? 'start' : undefined }
          : {
              display: 'flex',
              flexDirection: vertical ? 'column' : 'row',
              alignItems: context.options.value.autoHeight && !vertical ? 'flex-start' : undefined,
              [vertical ? 'paddingTop' : 'paddingInlineStart']: spacing.start ? `${spacing.start}px` : undefined,
              [vertical ? 'paddingBottom' : 'paddingInlineEnd']: spacing.end ? `${spacing.end}px` : undefined,
            }),
      }
    },
    () => ({ orientation: context.orientation.value }),
  )
}

/**
 * The native snap of one item. `inset` is where the first item rests (see the
 * viewport's `measure`): a `scroll-margin` of `inset` on the start side, and its
 * opposite on the end side when it is positive, makes the item's snap area the
 * one the measured snaps align, so a native scroll lands on the same position.
 */
function snapStyle(style: CarouselItemSnapStyle | undefined, vertical: boolean, skipSnaps: boolean, inset: number) {
  if (!style?.align)
    return { scrollSnapAlign: 'none' }
  const start = (style.margin ?? 0) + inset
  // A gutter (negative inset) only trims the start of the snap area to the item's content;
  // a positive inset (content padding) moves the whole area, keeping that space on every snap.
  const end = inset > 0 ? -inset : 0
  return {
    scrollSnapAlign: style.align,
    scrollSnapStop: skipSnaps ? undefined : 'always',
    [vertical ? 'scrollMarginTop' : 'scrollMarginInlineStart']: start ? `${start}px` : undefined,
    [vertical ? 'scrollMarginBottom' : 'scrollMarginInlineEnd']: end ? `${end}px` : undefined,
  }
}

/**
 * "2 of 5". Before mount the total is only known from `itemCount`: the server
 * renders the first items before the later ones are set up, so without it the
 * label waits for the client.
 */
function getItemLabel(context: CarouselRootContext, index: number): string | undefined {
  if (index === -1)
    return undefined
  const total = context.mounted.value ? context.items.value.length : context.itemCount.value
  return total ? `${index + 1} of ${total}` : undefined
}

/**
 * The per-item surface. Before the item is mounted its index is the order it
 * was set up in, which on the server and during hydration is its DOM order;
 * once mounted, it is read from the DOM.
 */
export function getCarouselItemSurface(context: CarouselRootContext, element: Ref<HTMLElement | null | undefined>): CarouselSurface<CarouselItemState> {
  const setupIndex = context.nextSetupIndex()
  const index = () => {
    const el = element.value
    if (el && context.mounted.value) {
      const i = context.itemIndex.value.get(el)
      if (i !== undefined)
        return i
    }
    return context.mounted.value ? -1 : setupIndex
  }
  const isActive = () => {
    const i = index()
    return i !== -1 && context.activeItems.value.has(i)
  }
  const inView = () => {
    if (context.options.value.fade)
      return isActive()
    const i = index()
    return i === -1 ? undefined : context.inView.value?.[i]
  }
  return createSurface<CarouselItemState>(
    () => {
      const i = index()
      const fade = context.options.value.fade
      const vertical = context.orientation.value === 'vertical'
      const hidden = inView() === false
      return {
        'role': 'group',
        'aria-roledescription': 'slide',
        'aria-label': getItemLabel(context, i),
        'aria-hidden': hidden ? 'true' : undefined,
        'inert': hidden ? '' : undefined,
        'style': compactStyle(fade
          ? {
              gridArea: '1 / 1',
              opacity: isActive() ? 1 : 0,
              pointerEvents: isActive() ? undefined : 'none',
            }
          : {
              flexShrink: 0,
              order: context.loopOrder.value?.[i],
              ...snapStyle(context.measured.value ? context.itemStyles.value[i] : context.getFallbackItemStyle(i), vertical, context.options.value.skipSnaps, context.measured.value ? context.snapInset.value : 0),
              // Before hydration, start on `defaultValue` where the browser supports it.
              scrollInitialTarget: !context.mounted.value && i === context.fallbackStartItem.value && i > 0 ? 'nearest' : undefined,
            }),
      }
    },
    () => {
      const i = index()
      return {
        index: i === -1 ? undefined : i,
        active: isActive(),
        inView: inView(),
        orientation: context.orientation.value,
      }
    },
  )
}

/**
 * The Carousel's state: the snap and rotation models and the context every part
 * reads. The scrolling itself (measuring, native scroll sync, drag, wheel,
 * keyboard, loop and auto scroll) needs the viewport element and lives in
 * `useCarouselViewport`, which `CarouselViewport` runs.
 *
 * SSR-safe: no `document`/`window` at call scope.
 */
export function useCarouselContext(
  props: CarouselRootProps,
  emits: ((event: 'update:modelValue', value: CarouselRootEmits['update:modelValue'][0]) => void) & ((event: 'update:playing', value: CarouselRootEmits['update:playing'][0]) => void),
  dir: Ref<Direction>,
  baseId: string,
): CarouselRootContext {
  const modelValue = useVModel(props, 'modelValue', emits, {
    defaultValue: props.defaultValue ?? 0,
    passive: (props.modelValue === undefined) as false,
  }) as Ref<number>
  const playing = useVModel(props, 'playing', emits, {
    defaultValue: props.defaultPlaying ?? true,
    passive: (props.playing === undefined) as false,
  }) as Ref<boolean>

  const orientation = computed<DataOrientation>(() => props.orientation ?? 'horizontal')
  const options = computed(() => ({
    loop: props.loop ?? false,
    align: props.align ?? 'start',
    slidesToScroll: props.slidesToScroll ?? 1,
    containScroll: props.containScroll ?? 'trimSnaps',
    dragFree: props.dragFree ?? false,
    skipSnaps: props.skipSnaps ?? false,
    draggable: props.draggable ?? true,
    fade: props.fade ?? false,
    autoHeight: props.autoHeight ?? false,
    wheel: props.wheel ?? false,
    inViewThreshold: props.inViewThreshold ?? 0,
  }))
  const autoplay = computed(() => resolveAutoplay(props.autoplay))
  // Fade has no track to scroll continuously.
  const autoScroll = computed(() => options.value.fade ? undefined : resolveAutoScroll(props.autoScroll))
  const rotationEnabled = computed(() => !!autoplay.value || !!autoScroll.value)

  const mounted = ref(false)
  const items = shallowRef<HTMLElement[]>([])
  const itemCount = computed(() => Math.max(0, props.itemCount ?? 0))
  let setupCount = 0

  const measuredSnaps = shallowRef<CarouselSnap[]>()
  const measured = computed(() => !!measuredSnaps.value)
  const groupSize = computed(() => getFixedGroupSize(options.value.slidesToScroll))
  // Until the track is measured (on the server, before hydration, in jsdom), every group of `slidesToScroll` items is a snap.
  const fallbackSnaps = computed<CarouselSnap[]>(() => {
    // Before the slides mount (on the server, in the first render), `itemCount` stands in for them.
    const count = items.value.length || itemCount.value
    const indices = Array.from({ length: count }, (_, i) => i)
    return chunk(indices, groupSize.value).map(group => ({ position: 0, items: group }))
  })
  const itemIndex = computed(() => new Map(items.value.map((item, i) => [item, i])))
  const snaps = computed(() => measuredSnaps.value ?? fallbackSnaps.value)
  const snapCount = computed(() => snaps.value.length)
  const loopFits = ref(true)
  // Unmeasured (server, jsdom), a loop is assumed to fit; the viewport turns it off for a track too short to wrap.
  const loopActive = computed(() => options.value.loop && snapCount.value > 1 && (!measured.value || loopFits.value))
  const activeItems = computed(() => {
    if (!mounted.value) {
      const start = modelValue.value * groupSize.value
      return new Set(Array.from({ length: groupSize.value }, (_, i) => start + i))
    }
    return new Set(snaps.value[modelValue.value]?.items ?? [])
  })
  const fallbackStartItem = computed(() => modelValue.value * groupSize.value)
  // Without measurements, aligning each group's first, middle or last item is the best guess.
  function getFallbackItemStyle(index: number): CarouselItemSnapStyle {
    const align = options.value.align
    const size = groupSize.value
    const leader = align === 'start' ? 0 : align === 'end' ? size - 1 : Math.floor((size - 1) / 2)
    return index % size === leader ? { align } : {}
  }

  /** Returns `false` when the index is unchanged or out of range. */
  function changeModelValue(index: number) {
    const count = snapCount.value
    if ((count > 0 && (index < 0 || index >= count)) || index === modelValue.value)
      return false
    modelValue.value = index
    return true
  }

  function scrollStep(step: 1 | -1) {
    const target = getStepTarget(modelValue.value, snaps.value, measured.value, loopActive.value, step)
    return target === undefined ? false : changeModelValue(target)
  }

  /** Returns `false` when the state is unchanged. */
  function setPlaying(value: boolean) {
    if (value === playing.value)
      return false
    playing.value = value
    return true
  }

  return {
    baseId,
    contentId: `${baseId}-content`,
    modelValue: computed(() => modelValue.value),
    changeModelValue,
    orientation,
    dir,
    options,
    autoplay,
    autoScroll,
    rotationEnabled,
    playing: computed(() => playing.value),
    setPlaying,
    paused: ref(false),
    reducedMotion: ref(false),
    mounted,
    items,
    itemIndex,
    registerItem(el) {
      if (items.value.includes(el))
        return
      items.value = [...items.value, el].sort(compareDocumentOrder)
    },
    unregisterItem(el) {
      if (items.value.includes(el))
        items.value = items.value.filter(item => item !== el)
    },
    nextSetupIndex: () => setupCount++,
    itemCount,
    measuredSnaps,
    measured,
    snaps,
    snapCount,
    activeItems,
    inView: shallowRef(),
    itemStyles: shallowRef([]),
    getFallbackItemStyle,
    fallbackStartItem,
    spacing: shallowRef({ start: 0, end: 0 }),
    snapInset: shallowRef(0),
    loopOrder: shallowRef(),
    loopActive,
    loopFits,
    canScrollPrev: computed(() => snapCount.value > 1 && (loopActive.value || modelValue.value > 0)),
    canScrollNext: computed(() => snapCount.value > 1 && (loopActive.value || modelValue.value < snapCount.value - 1)),
    scrollPrev: () => scrollStep(-1),
    scrollNext: () => scrollStep(1),
    dragging: ref(false),
    viewportElement: ref(),
    contentElement: ref(),
    reportInteraction() {
      const stops = autoplay.value?.stopOnInteraction || autoScroll.value?.stopOnInteraction
      if (stops && playing.value)
        setPlaying(false)
    },
  }
}
