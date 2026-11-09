<script lang="ts">
import type {
  FocusOutsideEvent,
  PointerDownOutsideEvent,
} from './utils'

import type { PrimitiveProps } from '@/Primitive'

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
import { useRender } from '@/Primitive'
import { renderAs } from '@/Primitive/renderAs'
import { useDismissableLayer } from './useDismissableLayer'

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
   * `disableOutsidePointerEvents` is on, e.g. a
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
const layer = useDismissableLayer({
  element: layerElement,
  disableOutsidePointerEvents: () => props.disableOutsidePointerEvents,
  present: () => props.present,
  backdropCutout: () => props.backdropCutout,
  onEscapeKeyDown: event => emits('escapeKeyDown', event),
  onPointerDownOutside: event => emits('pointerDownOutside', event),
  onFocusOutside: event => emits('focusOutside', event),
  onInteractOutside: event => emits('interactOutside', event),
  onDismiss: details => emits('dismiss', details),
})
</script>

<template>
  <component
    :is="renderAs(as, asChild)"
    :ref="elementRef"
    v-bind="layer.attrs()"
  >
    <slot />
  </component>
</template>
