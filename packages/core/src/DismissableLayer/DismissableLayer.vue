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
import { containsComposed } from '@/shared'
import {
  acquireBodyPointerEventsLock,
  branches,
  highestDisabledIndex,
  indexOfLayer,
  registerStackLayer,
  releaseBodyPointerEventsLock,
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
}>(), {
  disableOutsidePointerEvents: false,
  present: true,
})

const emits = defineEmits<DismissableLayerPrivateEmits>()

// Render via `useRender` (no `Primitive` wrapper instance). `elementRef` is the
// forwarded callback ref; `layerElement` the resolved root element.
const { tag, currentElement: layerElement, elementRef } = useRender({
  as: () => props.as,
  asChild: () => props.asChild,
})
const ownerDocument = computed(
  () => layerElement.value?.ownerDocument ?? globalThis.document,
)

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

const isBodyPointerEventsDisabled = computed(() => highestDisabledIndex() >= 0)

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

// Body pointer-events lock (#2674). `watch` with explicit sources (not
// `watchEffect`) so it re-runs only when this layer's `element` /
// `disableOutsidePointerEvents` / `present` change — never on other layers'
// membership churn. The manager reference-counts across layers (first disabling
// layer sets `none`, last restores), so the cleanup here (prop toggle or
// unmount) is order-independent (#2674).
watch(
  [layerElement, () => props.disableOutsidePointerEvents, () => props.present],
  ([element, disableOutsidePointerEvents, present], _, onCleanup) => {
    if (!element || !present)
      return
    if (disableOutsidePointerEvents) {
      acquireBodyPointerEventsLock(ownerDocument.value)
      onCleanup(() => releaseBodyPointerEventsLock(ownerDocument.value))
    }
  },
  { immediate: true },
)

// Membership in the layer stack follows presence, not mount: a hidden layer
// (e.g. a closed Dialog with `unmountOnHide: false`) must leave the stack so
// Escape and outside interactions target the layer that is actually visible.
// Kept separate from the pointer-events watch above so a
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
    :is="tag"
    :ref="elementRef"
    data-dismissable-layer
    :style="{
      pointerEvents: isBodyPointerEventsDisabled
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
