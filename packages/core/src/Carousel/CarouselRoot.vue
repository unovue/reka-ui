<script lang="ts">
import type { ComputedRef, Ref, ShallowRef } from 'vue'
import type { CarouselAutoplayOptions, CarouselAutoScrollOptions } from './useCarousel'
import type { CarouselAlign, CarouselContainScroll, CarouselItemSnapStyle, CarouselSlidesToScroll, CarouselSnap } from './utils'
import type { PrimitiveProps } from '@/Primitive'
import type { DataOrientation, Direction } from '@/shared/types'
import { createContext, useDirection, useForwardExpose, useId } from '@/shared'

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
  /** Returns `false` when the index is unchanged or out of range. */
  changeModelValue: (index: number) => boolean
  orientation: Ref<DataOrientation>
  dir: Ref<Direction>
  options: ComputedRef<CarouselResolvedOptions>
  autoplay: ComputedRef<Required<CarouselAutoplayOptions> | undefined>
  autoScroll: ComputedRef<Required<CarouselAutoScrollOptions> | undefined>
  /** Whether `autoplay` or `autoScroll` is set. */
  rotationEnabled: ComputedRef<boolean>
  playing: ComputedRef<boolean>
  /** Returns `false` when the state is unchanged. */
  setPlaying: (value: boolean) => boolean
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
  /** Where the first item rests in the viewport, measured: every snap rests its items at the same offset. */
  snapInset: ShallowRef<number>
  /** CSS `order` by DOM index while a loop is rotated. */
  loopOrder: ShallowRef<number[] | undefined>
  /** `loop` is set and the track is long enough to wrap. */
  loopActive: ComputedRef<boolean>
  /** Written by the viewport: whether the measured track is long enough to wrap. */
  loopFits: Ref<boolean>
  canScrollPrev: ComputedRef<boolean>
  canScrollNext: ComputedRef<boolean>
  scrollPrev: () => boolean
  scrollNext: () => boolean
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
  /** Event handler called when the current snap changes. */
  'update:modelValue': [value: number]
  /** Event handler called when rotation starts or stops. */
  'update:playing': [value: boolean]
}

export const [injectCarouselRootContext, provideCarouselRootContext]
  = createContext<CarouselRootContext>('CarouselRoot')
</script>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { Primitive } from '@/Primitive'
import { useCarouselContext } from './useCarousel'
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

const dir = useDirection(toRef(props, 'dir'))
const { forwardRef, currentElement } = useForwardExpose()

const context = useCarouselContext(props, emits, dir, useId(undefined, 'reka-carousel'))
provideCarouselRootContext(context)

// Hover, focus, visibility, reduced motion and the autoplay timer.
const rotation = useCarouselRotation(context, currentElement)
const playing = computed(() => context.rotationEnabled.value && context.playing.value)
</script>

<template>
  <Primitive
    :ref="forwardRef"
    :as="as"
    :as-child="asChild"
    :dir="dir"
    role="region"
    aria-roledescription="carousel"
    :data-orientation="context.orientation.value"
    :data-playing="playing ? '' : undefined"
    v-bind="rotation.attrs"
  >
    <slot
      :model-value="context.modelValue.value"
      :snap-count="context.snapCount.value"
      :can-scroll-prev="context.canScrollPrev.value"
      :can-scroll-next="context.canScrollNext.value"
      :scroll-prev="context.scrollPrev"
      :scroll-next="context.scrollNext"
      :scroll-to="context.changeModelValue"
      :playing="playing"
      :play="() => context.setPlaying(true)"
      :stop="() => context.setPlaying(false)"
    />
  </Primitive>
</template>
