import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { CarouselRootContext } from './CarouselRoot.vue'
import type { CarouselAlign, CarouselContainScroll, CarouselItemSnapStyle, CarouselSlidesToScroll, CarouselSnap } from './utils'
import type { BaseChangeReason, ChangeEventDetails, PartSurface } from '@/shared'
import type { DataOrientation, Direction } from '@/shared/types'
import { computed, ref, shallowRef, toValue } from 'vue'
import { createPartSurface, useControllableState } from '@/shared'
import { chunk } from '@/shared/arrays'
import { compareDocumentOrder } from '@/shared/documentOrder'
import { resolveDirection } from '@/shared/useDirection'
import { compactStyle, getFixedGroupSize, getSnapsByPosition, stepIndex } from './utils'

/**
 * Why the current snap changed; carried as `details.reason` on every change.
 *
 * - `'previous-press'` / `'next-press'`: `CarouselPrevious` / `CarouselNext`.
 * - `'indicator-press'`: a `CarouselIndicator`.
 * - `'keyboard'`: an arrow, Home or End key on the viewport.
 * - `'drag'`: a mouse or pen drag, or a swipe in `fade` mode.
 * - `'swipe'`: a native touch scroll.
 * - `'wheel'`: a wheel or trackpad gesture.
 * - `'scroll'`: any other native scroll, such as focus moving to an item.
 * - `'autoplay'`: autoplay or auto scroll.
 */
export type CarouselChangeReason
  = | 'previous-press'
    | 'next-press'
    | 'indicator-press'
    | 'keyboard'
    | 'drag'
    | 'swipe'
    | 'wheel'
    | 'scroll'
    | 'autoplay'

/**
 * Why rotation started or stopped; carried as `details.reason`.
 *
 * - `'toggle-press'`: `CarouselAutoplayToggle`.
 * - `'interaction'`: a press, drag, key or wheel gesture with `stopOnInteraction`.
 * - `'focus'`: keyboard focus entered the carousel.
 * - `'last-snap'`: the last snap was reached with `stopOnLastSnap`, or auto scroll reached the end.
 * - `'reduced-motion'`: the user prefers reduced motion.
 */
export type CarouselPlayingChangeReason
  = | 'toggle-press'
    | 'interaction'
    | 'focus'
    | 'last-snap'
    | 'reduced-motion'

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

export type CarouselRootState = { orientation: DataOrientation, playing: boolean }
export type CarouselViewportState = { orientation: DataOrientation, dragging: boolean }
export type CarouselContentState = { orientation: DataOrientation }
export type CarouselItemState = { index: number | undefined, active: boolean, inView: boolean | undefined, orientation: DataOrientation }
export type CarouselNavigationState = { disabled: boolean, orientation: DataOrientation }
export type CarouselIndicatorState = { active: boolean, orientation: DataOrientation }
export type CarouselAutoplayToggleState = { state: 'playing' | 'paused', disabled: boolean }

/** Standalone `useCarousel()` calls without a `baseId` draw `reka-carousel-<n>` from here. */
let carouselCount = 0

export interface UseCarouselProps {
  /** Controlled snap index. `undefined` means uncontrolled. */
  modelValue?: MaybeRefOrGetter<number | undefined>
  /** Initial snap index when uncontrolled. @defaultValue 0 */
  defaultValue?: number
  /** Controlled rotation state. `undefined` means uncontrolled. */
  playing?: MaybeRefOrGetter<boolean | undefined>
  /** Initial rotation state when uncontrolled. @defaultValue true */
  defaultPlaying?: boolean
  /** Component `emit`; fires `beforeUpdate:*` then `update:*` for `modelValue` and `playing`. */
  emit?: (event: any, ...args: any[]) => void
  /** @defaultValue 'horizontal' */
  orientation?: MaybeRefOrGetter<DataOrientation | undefined>
  /** Reading direction. Falls back to the nearest `ConfigProvider`, then `'ltr'`. */
  dir?: MaybeRefOrGetter<Direction | undefined>
  loop?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue 'start' */
  align?: MaybeRefOrGetter<CarouselAlign | undefined>
  /** @defaultValue 1 */
  slidesToScroll?: MaybeRefOrGetter<CarouselSlidesToScroll | undefined>
  /** @defaultValue 'trimSnaps' */
  containScroll?: MaybeRefOrGetter<CarouselContainScroll | undefined>
  dragFree?: MaybeRefOrGetter<boolean | undefined>
  skipSnaps?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue true */
  draggable?: MaybeRefOrGetter<boolean | undefined>
  fade?: MaybeRefOrGetter<boolean | undefined>
  autoHeight?: MaybeRefOrGetter<boolean | undefined>
  wheel?: MaybeRefOrGetter<boolean | undefined>
  /** @defaultValue 0 */
  inViewThreshold?: MaybeRefOrGetter<number | undefined>
  /** The number of slides, for `snapCount` before the slides have mounted (on the server). */
  itemCount?: MaybeRefOrGetter<number | undefined>
  autoplay?: MaybeRefOrGetter<boolean | CarouselAutoplayOptions | undefined>
  autoScroll?: MaybeRefOrGetter<boolean | CarouselAutoScrollOptions | undefined>
  /**
   * Base id the content id derives from. Defaults to `reka-carousel-<n>`
   * from a per-call counter, which is NOT stable across server and client:
   * SSR consumers must pass a stable `baseId`.
   */
  baseId?: string
}

export interface UseCarouselReturn {
  modelValue: ComputedRef<number>
  playing: ComputedRef<boolean>
  snapCount: ComputedRef<number>
  canScrollPrev: ComputedRef<boolean>
  canScrollNext: ComputedRef<boolean>
  scrollPrev: () => boolean
  scrollNext: () => boolean
  scrollTo: (index: number) => boolean
  play: () => boolean
  stop: () => boolean
  lastChangeDetails: Readonly<Ref<ChangeEventDetails<CarouselChangeReason>>>
  root: PartSurface<CarouselRootState>
  content: PartSurface<CarouselContentState>
  getItemSurface: (element: Ref<HTMLElement | null | undefined>) => PartSurface<CarouselItemState>
  previous: PartSurface<CarouselNavigationState>
  next: PartSurface<CarouselNavigationState>
  getIndicatorSurface: (index: MaybeRefOrGetter<number>) => PartSurface<CarouselIndicatorState>
  autoplayToggle: PartSurface<CarouselAutoplayToggleState>
  context: CarouselRootContext
}

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

export function getCarouselNavigationSurface(context: CarouselRootContext, kind: 'previous' | 'next'): PartSurface<CarouselNavigationState> {
  const disabled = () => kind === 'previous' ? !context.canScrollPrev.value : !context.canScrollNext.value
  return createPartSurface<CarouselNavigationState>(
    () => ({
      'aria-label': kind === 'previous' ? 'Previous slide' : 'Next slide',
      'aria-controls': context.contentId,
      'disabled': disabled(),
      'onClick': (event: MouseEvent) => {
        if (event.defaultPrevented || disabled())
          return
        context.reportInteraction()
        if (kind === 'previous')
          context.scrollPrev('previous-press', event)
        else
          context.scrollNext('next-press', event)
      },
    }),
    () => ({ disabled: disabled(), orientation: context.orientation.value }),
  )
}

export function getCarouselIndicatorSurface(context: CarouselRootContext, index: MaybeRefOrGetter<number>): PartSurface<CarouselIndicatorState> {
  const isActive = () => context.modelValue.value === toValue(index)
  return createPartSurface<CarouselIndicatorState>(
    () => ({
      'aria-label': `Go to slide ${toValue(index) + 1}`,
      'aria-controls': context.contentId,
      // APG grouped carousel: the current picker stays focusable but is marked unavailable.
      'aria-disabled': isActive() ? 'true' : undefined,
      'onClick': (event: MouseEvent) => {
        if (event.defaultPrevented || isActive())
          return
        context.reportInteraction()
        context.changeModelValue(toValue(index), 'indicator-press', event)
      },
    }),
    () => ({ active: isActive(), orientation: context.orientation.value }),
  )
}

export function getCarouselAutoplayToggleSurface(context: CarouselRootContext): PartSurface<CarouselAutoplayToggleState> {
  const playing = () => context.rotationEnabled.value && context.playing.value
  return createPartSurface<CarouselAutoplayToggleState>(
    () => ({
      'aria-label': playing() ? 'Stop slide rotation' : 'Start slide rotation',
      'aria-controls': context.contentId,
      'disabled': !context.rotationEnabled.value,
      'onClick': (event: MouseEvent) => {
        if (event.defaultPrevented || !context.rotationEnabled.value)
          return
        context.setPlaying(!context.playing.value, 'toggle-press', event)
      },
    }),
    () => ({ state: playing() ? 'playing' : 'paused', disabled: !context.rotationEnabled.value }),
  )
}

export function getCarouselContentSurface(context: CarouselRootContext): PartSurface<CarouselContentState> {
  return createPartSurface<CarouselContentState>(
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
export function getCarouselItemSurface(context: CarouselRootContext, element: Ref<HTMLElement | null | undefined>): PartSurface<CarouselItemState> {
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
  return createPartSurface<CarouselItemState>(
    () => {
      const i = index()
      const fade = context.options.value.fade
      const vertical = context.orientation.value === 'vertical'
      const visible = inView()
      const order = context.loopOrder.value?.[i]
      const hidden = visible === false
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
              order,
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
 * Headless Carousel logic: the snap and rotation models, the context and the
 * part surfaces. The scrolling itself (measuring, native scroll sync, drag,
 * wheel, keyboard, loop and auto scroll) needs the viewport element and lives
 * in `useCarouselViewport`, which `CarouselViewport` runs.
 *
 * SSR-safe: no `document`/`window` at call scope.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useCarousel(props: UseCarouselProps = {}): UseCarouselReturn {
  const baseId = props.baseId ?? `reka-carousel-${++carouselCount}`

  const { state: modelValue, setState, lastChangeDetails } = useControllableState<number, CarouselChangeReason>({
    prop: props.modelValue,
    defaultValue: props.defaultValue ?? 0,
    name: 'modelValue',
    emit: props.emit,
  })
  const { state: playing, setState: setPlayingState } = useControllableState<boolean, CarouselPlayingChangeReason>({
    prop: props.playing,
    defaultValue: props.defaultPlaying ?? true,
    name: 'playing',
    emit: props.emit,
  })

  const orientation = computed<DataOrientation>(() => toValue(props.orientation) ?? 'horizontal')
  const dir = resolveDirection(props.dir)
  const options = computed(() => ({
    loop: toValue(props.loop) ?? false,
    align: toValue(props.align) ?? 'start',
    slidesToScroll: toValue(props.slidesToScroll) ?? 1,
    containScroll: toValue(props.containScroll) ?? 'trimSnaps',
    dragFree: toValue(props.dragFree) ?? false,
    skipSnaps: toValue(props.skipSnaps) ?? false,
    draggable: toValue(props.draggable) ?? true,
    fade: toValue(props.fade) ?? false,
    autoHeight: toValue(props.autoHeight) ?? false,
    wheel: toValue(props.wheel) ?? false,
    inViewThreshold: toValue(props.inViewThreshold) ?? 0,
  }))
  const autoplay = computed(() => resolveAutoplay(toValue(props.autoplay)))
  // Fade has no track to scroll continuously.
  const autoScroll = computed(() => options.value.fade ? undefined : resolveAutoScroll(toValue(props.autoScroll)))
  const rotationEnabled = computed(() => !!autoplay.value || !!autoScroll.value)

  const mounted = ref(false)
  const items = shallowRef<HTMLElement[]>([])
  const itemCount = computed(() => Math.max(0, toValue(props.itemCount) ?? 0))
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

  function changeModelValue(index: number, reason: CarouselChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    const count = snapCount.value
    if (count > 0 && (index < 0 || index >= count))
      return false
    return setState(index, reason, event)
  }

  function scrollStep(step: 1 | -1, reason: CarouselChangeReason | BaseChangeReason, event?: Event) {
    const target = getStepTarget(modelValue.value, snaps.value, measured.value, loopActive.value, step)
    return target === undefined ? false : changeModelValue(target, reason, event)
  }

  function setPlaying(value: boolean, reason: CarouselPlayingChangeReason | BaseChangeReason = 'imperative-action', event?: Event) {
    return setPlayingState(value, reason, event)
  }

  const context: CarouselRootContext = {
    baseId,
    contentId: `${baseId}-content`,
    modelValue,
    changeModelValue,
    orientation: orientation as Ref<DataOrientation>,
    dir: dir as Ref<Direction>,
    options,
    autoplay,
    autoScroll,
    rotationEnabled,
    playing,
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
    scrollPrev: (reason = 'imperative-action', event) => scrollStep(-1, reason, event),
    scrollNext: (reason = 'imperative-action', event) => scrollStep(1, reason, event),
    dragging: ref(false),
    viewportElement: ref(),
    contentElement: ref(),
    reportInteraction() {
      const stops = autoplay.value?.stopOnInteraction || autoScroll.value?.stopOnInteraction
      if (stops && playing.value)
        setPlaying(false, 'interaction')
    },
  }

  const root = createPartSurface<CarouselRootState>(
    () => ({
      'dir': dir.value,
      'role': 'region',
      'aria-roledescription': 'carousel',
    }),
    () => ({ orientation: orientation.value, playing: rotationEnabled.value && playing.value }),
  )

  return {
    modelValue,
    playing,
    snapCount,
    canScrollPrev: context.canScrollPrev,
    canScrollNext: context.canScrollNext,
    scrollPrev: () => context.scrollPrev(),
    scrollNext: () => context.scrollNext(),
    scrollTo: index => changeModelValue(index),
    play: () => setPlaying(true),
    stop: () => setPlaying(false),
    lastChangeDetails,
    root,
    content: getCarouselContentSurface(context),
    getItemSurface: element => getCarouselItemSurface(context, element),
    previous: getCarouselNavigationSurface(context, 'previous'),
    next: getCarouselNavigationSurface(context, 'next'),
    getIndicatorSurface: index => getCarouselIndicatorSurface(context, index),
    autoplayToggle: getCarouselAutoplayToggleSurface(context),
    context,
  }
}
