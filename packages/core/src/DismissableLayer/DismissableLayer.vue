<script lang="ts">
import type {
  FocusOutsideEvent,
  PointerDownOutsideEvent,
} from './utils'

import type { PrimitiveProps } from '@/Primitive'
import {
  computed,
  nextTick,
  watch,
} from 'vue'

export interface DismissableLayerProps extends PrimitiveProps {
  /**
   * When `true`, hover/focus/click interactions will be disabled on elements outside
   * the `DismissableLayer`. Users will need to click twice on outside elements to
   * interact with them: once to close the `DismissableLayer`, and again to trigger the element.
   *
   * Outside elements are covered by a transparent internal backdrop
   * (`[data-reka-internal-backdrop]`) rendered right below the layer; `<body>`
   * styles are never touched.
   */
  disableOutsidePointerEvents?: boolean
}

export type DismissableLayerEmits = {
  /**
   * Event handler called when the escape key is down.
   * Can be prevented.
   */
  escapeKeyDown: [event: KeyboardEvent]
  /**
   * Event handler called when a `pointerdown` event happens outside of the `DismissableLayer`.
   * Can be prevented.
   */
  pointerDownOutside: [event: PointerDownOutsideEvent]
  /**
   * Event handler called when the focus moves outside of the `DismissableLayer`.
   * Can be prevented.
   */
  focusOutside: [ event: FocusOutsideEvent]
  /**
   * Event handler called when an interaction happens outside the `DismissableLayer`.
   * Specifically, when a `pointerdown` event happens outside or focus moves outside of it.
   * Can be prevented.
   */
  interactOutside: [ event: PointerDownOutsideEvent | FocusOutsideEvent]
}

/** Which interaction dismissed the layer (#2828). */
export type DismissableLayerDismissReason = 'escape-key' | 'outside-press' | 'focus-outside'

/** Payload of the private `dismiss` emit: the reason plus the interaction's event. */
export interface DismissableLayerDismissDetails {
  reason: DismissableLayerDismissReason
  event: KeyboardEvent | PointerDownOutsideEvent | FocusOutsideEvent
}

export type DismissableLayerPrivateEmits = DismissableLayerEmits & {
  /**
   * Handler called when the `DismissableLayer` should be dismissed.
   * Carries `{ reason, event }` so consumers can report why they closed.
   */
  dismiss: [details: DismissableLayerDismissDetails]
}
</script>

<script setup lang="ts">
import type { StackLayer } from './layerStack'
import {
  useRender,
} from '@/Primitive'
import { renderAs } from '@/Primitive/renderAs'
import { containsComposed } from '@/shared'
import { blockPositioningWrapper, mountInternalBackdrop } from './internalBackdrop'
import {
  branches,
  highestDisabledIndex,
  indexOfLayer,
  registerStackLayer,
} from './layerStack'
import {
  useFocusOutside,
  usePointerDownOutside,
} from './utils'

const props = withDefaults(defineProps<DismissableLayerProps & {
  /**
   * Whether the layer is currently active. A layer that stays mounted while
   * hidden (e.g. a Dialog with `unmountOnHide: false`) must opt out of the
   * layer stack, otherwise it would be treated as the topmost layer and
   * swallow Escape / outside interactions meant for the visible one.
   * Kept out of the public `DismissableLayerProps` on purpose — it is
   * internal plumbing between primitives.
   */
  present?: boolean
  /**
   * Element left interactive through a hole in the internal backdrop while
   * `disableOutsidePointerEvents` is on (Base UI's backdrop `cutout`), e.g. a
   * Combobox input or a ContextMenu trigger area. Internal plumbing.
   */
  backdropCutout?: HTMLElement | null
}>(), {
  disableOutsidePointerEvents: false,
  present: true,
})

const emits = defineEmits<DismissableLayerPrivateEmits>()

// Render via `useRender` (no `Primitive` wrapper instance). `elementRef` is the
// forwarded callback ref; `layerElement` the resolved root element.
const { currentElement: layerElement, elementRef, expose } = useRender({
  as: () => props.as,
  asChild: () => props.asChild,
})
defineExpose(expose)
// Participation in the shared stack manager. The manager routes Escape to the
// top *present* layer only (replacing the per-layer `window` keydown listener),
// so `onEscapeKeyDown` here just carries the emit + dismiss. Membership is driven
// by the presence watch below.
const stackLayer: StackLayer = {
  element: () => layerElement.value,
  isPresent: () => props.present,
  disableOutsidePointerEvents: () => props.disableOutsidePointerEvents,
  onEscapeKeyDown: (event) => {
    emits('escapeKeyDown', event)
    if (!event.defaultPrevented)
      emits('dismiss', { reason: 'escape-key', event })
  },
}

// Read from the shared manager (array `indexOf`, no per-read `Array.from`).
// `-1` when this layer is not in the stack (not present) — same as before.
const index = computed(() => indexOfLayer(stackLayer))

const hasModalLayer = computed(() => highestDisabledIndex() >= 0)

const isPointerEventsEnabled = computed(() => index.value >= highestDisabledIndex())

// A layer that stays mounted while hidden (e.g. a Dialog with `unmountOnHide: false`)
// must not listen while it is not present, hence the `present` guard passed as
// `enabled` (it unsubscribes from the shared manager, which also cancels any
// pending touch deferral). On touch the dispatch is deferred to the `click`
// event, so a `pointerdown` captured while hidden would be delivered right after
// the layer opened and dismiss it on the very interaction that opened it.
const pointerDownOutside = usePointerDownOutside(async (event) => {
  const isPointerDownOnBranch = [...branches].some(branch =>
    containsComposed(branch, event.target as Node),
  )

  if (!props.present || !isPointerEventsEnabled.value || isPointerDownOnBranch)
    return
  emits('pointerDownOutside', event)
  emits('interactOutside', event)
  await nextTick()
  if (!event.defaultPrevented)
    emits('dismiss', { reason: 'outside-press', event })
}, layerElement, () => props.present)

const focusOutside = useFocusOutside((event) => {
  const isFocusInBranch = [...branches].some(branch =>
    containsComposed(branch, event.target as Node),
  )

  if (!props.present || isFocusInBranch)
    return
  emits('focusOutside', event)
  emits('interactOutside', event)
  if (!event.defaultPrevented)
    emits('dismiss', { reason: 'focus-outside', event })
}, layerElement, () => props.present)

// Internal backdrop (#2822, replaces the body `pointer-events: none` lock of
// #2674/#2867). `watch` with explicit sources (not `watchEffect`) so it re-runs
// only when this layer's `element` / `disableOutsidePointerEvents` / `present`
// / cutout change, never on other layers' membership churn. Each modal layer
// owns its own backdrop, so the cleanup (prop toggle or unmount) is
// order-independent, and nothing is ever mounted during SSR (`layerElement`
// only resolves on the client).
watch(
  [layerElement, () => props.disableOutsidePointerEvents, () => props.present, () => props.backdropCutout],
  ([element, disableOutsidePointerEvents, present, cutout], _, onCleanup) => {
    if (!element || !present || !disableOutsidePointerEvents)
      return
    onCleanup(mountInternalBackdrop(element, cutout))
  },
  { immediate: true },
)

// A layer below a modal one is inert (`pointer-events: none` on the layer,
// see the template). Its positioning wrapper, which sits outside the layer
// element, must not stay hit-testable over the modal layer's backdrop.
watch(
  [layerElement, () => hasModalLayer.value && !isPointerEventsEnabled.value],
  ([element, blocked], _, onCleanup) => {
    if (element && blocked)
      onCleanup(blockPositioningWrapper(element))
  },
  { immediate: true },
)

// Membership in the layer stack follows presence, not mount: a hidden layer
// (e.g. a closed Dialog with `unmountOnHide: false`) must leave the stack so
// Escape and outside interactions target the layer that is actually visible.
// Kept separate from the backdrop watch above so a
// `disableOutsidePointerEvents` toggle alone never re-orders the stack.
watch(
  [layerElement, () => props.present],
  ([element, present], _, onCleanup) => {
    if (!element || !present)
      return
    // `registerStackLayer`'s unregister (fired on prop toggle or unmount) is the
    // sole stack-membership cleanup — no separate unmount safety-net needed, as
    // this watch already keys on `layerElement` (handles forwardRef swaps).
    onCleanup(registerStackLayer(stackLayer))
  },
  { immediate: true },
)
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="elementRef"
    data-dismissable-layer
    :style="{
      pointerEvents: hasModalLayer
        ? isPointerEventsEnabled
          ? 'auto'
          : 'none'
        : undefined,
    }"
    @focus.capture="focusOutside.onFocusCapture"
    @blur.capture="focusOutside.onBlurCapture"
    @pointerdown.capture="pointerDownOutside.onPointerDownCapture"
  >
    <slot />
  </component>
</template>
