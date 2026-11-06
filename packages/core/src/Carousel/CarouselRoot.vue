<script lang="ts">
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import type { CarouselAutoplayOptions, CarouselAutoScrollOptions, CarouselChangeReason, CarouselPlayingChangeReason } from './useCarousel'
import type { CarouselAlign, CarouselContainScroll, CarouselItemSnapStyle, CarouselSlidesToScroll, CarouselSnap } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import type { BaseChangeReason, ChangeEventDetails } from '@/shared'
import type { DataOrientation, Direction } from '@/shared/types'
import { createContext, useDirection, useForwardElement, useId } from '@/shared'

export interface CarouselResolvedOptions {
  loop: boolean
  align: CarouselAlign
  slidesToScroll: CarouselSlidesToScroll
  containScroll: CarouselContainScroll
  dragFree: boolean
  skipSnaps: boolean
  draggable: boolean
  fade: boolean
  autoHeight: boolean
  wheel: boolean
  inViewThreshold: number
}

export interface CarouselRootContext {
  baseId: string
  contentId: string
  /** The current snap index. Read-only: call `changeModelValue` to change it. */
  modelValue: ComputedRef<number>
  /** Returns `false` when the index is unchanged, out of range or the change was cancelled. */
  changeModelValue: (index: number, reason?: CarouselChangeReason | BaseChangeReason, event?: Event) => boolean
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
  options: ComputedRef<CarouselResolvedOptions>
  autoplay: ComputedRef<Required<CarouselAutoplayOptions> | undefined>
  autoScroll: ComputedRef<Required<CarouselAutoScrollOptions> | undefined>
  /** Whether `autoplay` or `autoScroll` is set. */
  rotationEnabled: ComputedRef<boolean>
  playing: ComputedRef<boolean>
  setPlaying: (value: boolean, reason?: CarouselPlayingChangeReason | BaseChangeReason, event?: Event) => boolean
  /** Rotation is held, without changing `playing`: hover, a drag, a hidden page. */
  paused: Ref<boolean>
  reducedMotion: Ref<boolean>
  mounted: Ref<boolean>
  /** The mounted items, in DOM order. */
  items: ShallowRef<HTMLElement[]>
  /** Each mounted item's DOM index. */
  itemIndex: ComputedRef<Map<HTMLElement, number>>
  registerItem: (el: HTMLElement) => void
  unregisterItem: (el: HTMLElement) => void
  /** The `itemCount` prop: the number of slides before they mount. */
  itemCount: ComputedRef<number>
  /** The order an item was set up in: its index until it is mounted. */
  nextSetupIndex: () => number
  /** The snaps measured by the viewport, `undefined` until the track has a size. */
  measuredSnaps: ShallowRef<CarouselSnap[] | undefined>
  measured: ComputedRef<boolean>
  snaps: ComputedRef<CarouselSnap[]>
  snapCount: ComputedRef<number>
  /** DOM indices of the items the current snap brings into place. */
  activeItems: ComputedRef<Set<number>>
  /** Whether each item is in view, by DOM index; `undefined` until measured. */
  inView: ShallowRef<boolean[] | undefined>
  /** Measured native snap styles, by DOM index. */
  itemStyles: ShallowRef<CarouselItemSnapStyle[]>
  getFallbackItemStyle: (index: number) => CarouselItemSnapStyle
  /** The item `defaultValue` starts on before measurements. */
  fallbackStartItem: ComputedRef<number>
  /** Space `containScroll: false` adds at the ends of the track. */
  spacing: ShallowRef<{ start: number, end: number }>
  /** CSS `order` by DOM index while a loop is rotated. */
  loopOrder: ShallowRef<number[] | undefined>
  /** `loop` is set and the track is long enough to wrap. */
  loopActive: ComputedRef<boolean>
  /** Written by the viewport: whether the measured track is long enough to wrap. */
  loopFits: Ref<boolean>
  canScrollPrev: ComputedRef<boolean>
  canScrollNext: ComputedRef<boolean>
  scrollPrev: (reason?: CarouselChangeReason | BaseChangeReason, event?: Event) => boolean
  scrollNext: (reason?: CarouselChangeReason | BaseChangeReason, event?: Event) => boolean
  dragging: Ref<boolean>
  viewportElement: Ref<HTMLElement | undefined>
  contentElement: Ref<HTMLElement | undefined>
  /** A user press, drag, key or wheel gesture: stops rotation when `stopOnInteraction` is set. */
  reportInteraction: () => void
}

export interface CarouselRootProps extends PrimitiveProps {
  /** The controlled index of the current snap. Can be bound as `v-model`. */
  modelValue?: number
  /**
   * The index of the snap to show when initially rendered. Use when you do not need to control the index.
   * @defaultValue 0
   */
  defaultValue?: number
  /**
   * The axis the slides are laid out and scroll along.
   * @defaultValue horizontal
   */
  orientation?: DataOrientation
  /**
   * The reading direction of the carousel. <br> If omitted, inherits globally from `ConfigProvider` or assumes LTR (left-to-right) reading mode.
   */
  dir?: Direction
  /** When `true`, the last slide is followed by the first one, and vice versa. Falls back to `false` when the slides are too few to wrap. */
  loop?: boolean
  /**
   * Where a snap places its slides in the viewport.
   * @defaultValue start
   */
  align?: CarouselAlign
  /**
   * How many slides one navigation step moves. `'auto'` moves as many as fit in the viewport.
   * @defaultValue 1
   */
  slidesToScroll?: CarouselSlidesToScroll
  /**
   * How the snaps at the ends of the track are handled. `'trimSnaps'` merges the snaps that would leave empty space,
   * `'keepSnaps'` keeps one snap per group, `false` adds empty space so every snap can be aligned. Ignored with `loop`.
   * @defaultValue trimSnaps
   */
  containScroll?: CarouselContainScroll
  /** When `true`, the track scrolls freely with momentum instead of resting on a snap. */
  dragFree?: boolean
  /** When `true`, a fast gesture can move past several snaps. When `false`, one gesture moves one snap. */
  skipSnaps?: boolean
  /**
   * When `false`, the track can't be dragged, swiped or scrolled by the user; the controls still navigate.
   * @defaultValue true
   */
  draggable?: boolean
  /** When `true`, slides are stacked and cross-fade instead of sliding. Set the `transition` on the items yourself. */
  fade?: boolean
  /** When `true`, the viewport takes the height of the current slides. Horizontal only. */
  autoHeight?: boolean
  /** When `true`, a mouse wheel pages through the snaps, and in `fade` mode the wheel and trackpad do too. */
  wheel?: boolean
  /**
   * The fraction (0 to 1) of an item that has to be visible for it to count as in view.
   * @defaultValue 0
   */
  inViewThreshold?: number
  /**
   * The number of slides. Only needed on the server, to render `snapCount`, the indicators, the enabled
   * Previous/Next and the slide labels before hydration: the slides register once mounted, and their count wins from then on.
   */
  itemCount?: number
  /** Advance to the next snap on an interval. Pauses on hover, stops when keyboard focus enters the carousel. */
  autoplay?: boolean | CarouselAutoplayOptions
  /** Scroll the track continuously. Pauses on hover, stops when keyboard focus enters the carousel. */
  autoScroll?: boolean | CarouselAutoScrollOptions
  /** The controlled rotation state of `autoplay` or `autoScroll`. Can be bound as `v-model:playing`. */
  playing?: boolean
  /**
   * The rotation state when initially rendered. Rotation stops on mount when the user prefers reduced motion.
   * @defaultValue true
   */
  defaultPlaying?: boolean
}

export type CarouselRootEmits = {
  /** Event handler called before the current snap changes; call `details.cancel()` to keep it. */
  'beforeUpdate:modelValue': [value: number, details: ChangeEventDetails<CarouselChangeReason>]
  /** Event handler called when the current snap changes. */
  'update:modelValue': [value: number, details: ChangeEventDetails<CarouselChangeReason>]
  /** Event handler called before rotation starts or stops; call `details.cancel()` to keep the current state. */
  'beforeUpdate:playing': [value: boolean, details: ChangeEventDetails<CarouselPlayingChangeReason>]
  /** Event handler called when rotation starts or stops. */
  'update:playing': [value: boolean, details: ChangeEventDetails<CarouselPlayingChangeReason>]
}

export const [injectCarouselRootContext, provideCarouselRootContext]
  = createContext<CarouselRootContext>('CarouselRoot')
</script>

<script setup lang="ts">
import { renderAs } from '@/Primitive/renderAs'
import { useCarousel } from './useCarousel'
import { useCarouselRotation } from './useCarouselRotation'

const props = withDefaults(defineProps<CarouselRootProps>(), {
  modelValue: undefined,
  orientation: 'horizontal',
  align: 'start',
  slidesToScroll: 1,
  containScroll: 'trimSnaps',
  draggable: true,
  inViewThreshold: 0,
  autoplay: false,
  autoScroll: false,
  playing: undefined,
  defaultPlaying: true,
})
const emits = defineEmits<CarouselRootEmits>()

defineSlots<{
  default?: (props: {
    /** The current snap index */
    modelValue: number
    /** The number of snaps */
    snapCount: number
    /** Whether there is a snap before the current one */
    canScrollPrev: boolean
    /** Whether there is a snap after the current one */
    canScrollNext: boolean
    /** Go to the previous snap */
    scrollPrev: () => boolean
    /** Go to the next snap */
    scrollNext: () => boolean
    /** Go to the snap at `index` */
    scrollTo: (index: number) => boolean
    /** Whether `autoplay` or `autoScroll` is rotating */
    playing: boolean
    /** Start rotation */
    play: () => boolean
    /** Stop rotation */
    stop: () => boolean
  }) => any
}>()

const dir = useDirection(() => props.dir)
const { forwardRef, currentElement, expose } = useForwardElement()
defineExpose(expose)

const carousel = useCarousel({
  modelValue: () => props.modelValue,
  defaultValue: props.defaultValue,
  playing: () => props.playing,
  defaultPlaying: props.defaultPlaying,
  emit: emits,
  orientation: () => props.orientation,
  dir,
  loop: () => props.loop,
  align: () => props.align,
  slidesToScroll: () => props.slidesToScroll,
  containScroll: () => props.containScroll,
  dragFree: () => props.dragFree,
  skipSnaps: () => props.skipSnaps,
  draggable: () => props.draggable,
  fade: () => props.fade,
  autoHeight: () => props.autoHeight,
  wheel: () => props.wheel,
  inViewThreshold: () => props.inViewThreshold,
  itemCount: () => props.itemCount,
  autoplay: () => props.autoplay,
  autoScroll: () => props.autoScroll,
  baseId: useId(undefined, 'reka-carousel'),
})
const { context, root } = carousel

provideCarouselRootContext(context)

// Hover, focus, visibility, reduced motion and the autoplay timer.
const rotation = useCarouselRotation(context, currentElement)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="forwardRef"
    v-bind="{ ...root.attrs.value, ...rotation.attrs }"
  >
    <slot
      :model-value="carousel.modelValue.value"
      :snap-count="carousel.snapCount.value"
      :can-scroll-prev="carousel.canScrollPrev.value"
      :can-scroll-next="carousel.canScrollNext.value"
      :scroll-prev="carousel.scrollPrev"
      :scroll-next="carousel.scrollNext"
      :scroll-to="carousel.scrollTo"
      :playing="context.rotationEnabled.value && carousel.playing.value"
      :play="carousel.play"
      :stop="carousel.stop"
    />
  </component>
</template>
